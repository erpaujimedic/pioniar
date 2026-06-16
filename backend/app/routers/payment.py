from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.tripay_service import tripay_service
from app.services.mikrotik_service import mikrotik_service
from app.services.supabase_service import supabase_service
from app.core.db import get_session, Transaction
from sqlmodel import Session, select
import random
import string
import datetime

router = APIRouter()

class CreateTransactionRequest(BaseModel):
    plan_name: str
    price: int

@router.post("/create")
async def create_transaction(data: CreateTransactionRequest, db: Session = Depends(get_session)):
    if not data.plan_name or not data.price:
        raise HTTPException(status_code=400, detail="Invalid plan data")
        
    random_str = ''.join(random.choices(string.digits, k=4))
    username = f"PION-{random_str}"
    
    safe_plan = data.plan_name.replace(' ', '_')
    merchant_ref = f"PION-HOTSPOT-{safe_plan}-{username}"
    
    order_items = [
        {
            'sku': safe_plan,
            'name': f"Voucher WiFi: {data.plan_name}",
            'price': data.price,
            'quantity': 1,
        }
    ]
    
    success, res = await tripay_service.request_transaction(
        method='QRIS',
        merchant_ref=merchant_ref,
        amount=data.price,
        customer_name='Pelanggan Pioniar',
        customer_email='pelanggan@pioniar.net',
        customer_phone='081234567890',
        order_items=order_items,
        return_url=f'https://pioniar.com/portal/checkout?ref={merchant_ref}'
    )
    
    if success:
        tx_data = res.get('data', {})
        
        new_tx = Transaction(
            merchant_ref=merchant_ref,
            status="UNPAID",
            username=username,
            plan=data.plan_name,
            checkout_url=tx_data.get('checkout_url'),
            qr_url=tx_data.get('qr_url'),
            amount=data.price
        )
        db.add(new_tx)
        db.commit()
        
        return {
            "status": "Success",
            "merchant_ref": merchant_ref,
            "checkout_url": tx_data.get('checkout_url'),
            "qr_url": tx_data.get('qr_url'),
            "tripay_data": tx_data
        }
    else:
        raise HTTPException(status_code=500, detail=str(res))

@router.post("/callback")
async def callback(request: Request, db: Session = Depends(get_session)):
    json_data = await request.json()
    callback_signature = request.headers.get('x-callback-signature')
    
    if not callback_signature:
        raise HTTPException(status_code=400, detail="No signature")
        
    raw_body = await request.body()
    if not tripay_service.verify_callback_signature(raw_body.decode('utf-8'), callback_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    if json_data.get('status') == 'PAID':
        merchant_ref = json_data.get('merchant_ref')
        
        tx = db.exec(select(Transaction).where(Transaction.merchant_ref == merchant_ref)).first()
        
        if tx and tx.status != 'PAID':
            username = tx.username
            plan_name = tx.plan
            price = tx.amount
            
            success, msg = mikrotik_service.generate_voucher(username, username, plan_name)
            if success:
                supabase_service.insert_voucher(username, username, plan_name, price)
                sold_at = datetime.datetime.now().isoformat()
                supabase_service.insert_sale(username, plan_name, price, sold_at)
                
            tx.status = 'PAID'
            db.add(tx)
            db.commit()
            
    return {"success": True}

@router.get("/status")
def get_status(ref: str, db: Session = Depends(get_session)):
    if not ref:
        raise HTTPException(status_code=400, detail="Missing ref")
        
    tx = db.exec(select(Transaction).where(Transaction.merchant_ref == ref)).first()
    
    if tx:
        return {
            "status": "Success",
            "payment_status": tx.status,
            "username": tx.username if tx.status == 'PAID' else None
        }
    raise HTTPException(status_code=404, detail="Not found")
