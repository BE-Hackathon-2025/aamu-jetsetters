#!/usr/bin/env python3
import pickle
import json
import numpy as np
from flask import Flask, request, jsonify
from pathlib import Path
import sys
import os

app = Flask(__name__)

model = None
scaler = None
feature_names = None
model_loaded = False

def load_model():
    global model, scaler, feature_names, model_loaded
    
    try:
        script_path = Path(__file__).resolve()
        possible_paths = [
            script_path.parent.parent.parent.parent / 'models',
            script_path.parent.parent.parent / 'models',
            Path.cwd().parent / 'models',
            Path.cwd() / 'models',
            Path('/opt/render/project/src/models'),
            Path('/app/models'),
        ]
        
        models_dir = None
        for path in possible_paths:
            if (path / 'random_forest_model.pkl').exists():
                models_dir = path
                break
        
        if not models_dir:
            print(f"Error: Model files not found. Checked: {possible_paths}", file=sys.stderr)
            return False
        
        model_path = models_dir / 'random_forest_model.pkl'
        scaler_path = models_dir / 'feature_scaler.pkl'
        feature_names_path = models_dir / 'feature_names.pkl'
        
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        
        with open(feature_names_path, 'rb') as f:
            feature_names = pickle.load(f)
        
        model_loaded = True
        print(f"Model loaded successfully. Features: {len(feature_names)}", file=sys.stderr)
        return True
    except Exception as e:
        print(f"Error loading model: {str(e)}", file=sys.stderr)
        return False

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok' if model_loaded else 'error',
        'model_loaded': model_loaded
    })

@app.route('/predict', methods=['POST'])
def predict():
    if not model_loaded:
        return jsonify({
            'error': 'Model not loaded',
            'anomaly_score': 0.0
        }), 500
    
    try:
        data = request.json
        sequence = np.array(data.get('sequence', []))
        
        if sequence.shape != (24, 145):
            return jsonify({
                'error': f'Invalid sequence shape. Expected (24, 145), got {sequence.shape}',
                'anomaly_score': 0.0
            }), 400
        
        latest_features = sequence[-1]
        sequence_scaled = scaler.transform([latest_features])
        
        prediction = model.predict_proba(sequence_scaled)[0]
        
        anomaly_score = float(prediction[1] if len(prediction) > 1 else prediction[0])
        
        if hasattr(model, 'feature_importances_'):
            feature_importance = model.feature_importances_.tolist()
        else:
            feature_importance = None
        
        return jsonify({
            'anomaly_score': anomaly_score,
            'feature_importance': feature_importance,
            'status': 'success'
        })
    except Exception as e:
        print(f"Prediction error: {str(e)}", file=sys.stderr)
        return jsonify({
            'error': str(e),
            'anomaly_score': 0.0
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('ML_SERVICE_PORT', 5000))
    if load_model():
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        print("Failed to load model. Exiting.", file=sys.stderr)
        sys.exit(1)

