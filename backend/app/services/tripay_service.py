import os
import hmac
import hashlib
import json
import urllib.parse
import time
import requests
from dotenv import load_dotenv

load_dotenv()

class TripayService:
    def __init__(self):
        self.api_key = os.getenv('TRIPAY_API_KEY')
        self.private_key = os.getenv('TRIPAY_PRIVATE_KEY')
        self.merchant_code = os.getenv('TRIPAY_MERCHANT_CODE')
        self.mode = os.getenv('TRIPAY_MODE', 'sandbox')
        
        if self.mode == 'production':
            self.base_url = 'https://tripay.co.id/api'
        else:
            self.base_url = 'https://tripay.co.id/api-sandbox'
            
    def _generate_signature(self, merchant_ref, amount):
        payload = f"{self.merchant_code}{merchant_ref}{amount}"
        signature = hmac.new(
            self.private_key.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature

    def verify_callback_signature(self, json_content, callback_signature):
        computed_signature = hmac.new(
            self.private_key.encode('utf-8'),
            json_content.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return computed_signature == callback_signature

    def request_transaction(self, method, merchant_ref, amount, customer_name, customer_email, customer_phone, order_items, return_url):
        endpoint = f"{self.base_url}/transaction/create"
        
        signature = self._generate_signature(merchant_ref, amount)
        
        payload = {
            'method': method,
            'merchant_ref': merchant_ref,
            'amount': amount,
            'customer_name': customer_name,
            'customer_email': customer_email,
            'customer_phone': customer_phone,
            'order_items': order_items,
            'return_url': return_url,
            'expired_time': int(time.time()) + (24 * 60 * 60), # 24 hours
            'signature': signature
        }
        
        headers = {
            'Authorization': f'Bearer {self.api_key}'
        }
        
        try:
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            return True, response.json()
        except Exception as e:
            err_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    err_data = e.response.json()
                    err_msg = err_data.get('message', err_msg)
                except:
                    pass
            return False, err_msg

tripay_service = TripayService()
