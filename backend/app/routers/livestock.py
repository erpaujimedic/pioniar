from flask import Blueprint, jsonify

bp = Blueprint('livestock', __name__)

@bp.route("/", methods=["GET"])
def get_livestock():
    return jsonify({"message": "Livestock API is under development"})
