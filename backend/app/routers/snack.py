from flask import Blueprint, jsonify

bp = Blueprint('snack', __name__)

@bp.route("/", methods=["GET"])
def get_snacks():
    return jsonify({"message": "Snack API is under development"})
