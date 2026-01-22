import traceback
import tensorflow as tf
from tensorflow.keras.layers import InputLayer as TFInputLayer

class CompatInputLayer(TFInputLayer):
    def __init__(self, batch_shape=None, **kwargs):
        # Map legacy 'batch_shape' -> 'batch_input_shape'
        if batch_shape is not None:
            kwargs.setdefault('batch_input_shape', batch_shape)
        super().__init__(**kwargs)

in_path = "fastapi_backend/models/deepfake_model.h5"
out_path = "fastapi_backend/models/deepfake_model_compat.h5"

print("Using Python:", __import__('sys').executable)
print("TensorFlow version:", tf.__version__)
print("Input model:", in_path)

try:
    print("Loading model with CompatInputLayer wrapper...")
    m = tf.keras.models.load_model(in_path, compile=False, custom_objects={"InputLayer": CompatInputLayer})
    print("Loaded model successfully. Saving to:", out_path)
    m.save(out_path)
    print("Saved compatible model successfully.")
except Exception as e:
    print("Failed to load or save model:")
    traceback.print_exc()
    raise
