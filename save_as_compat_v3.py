import traceback
import tensorflow as tf
from tensorflow.keras.layers import InputLayer as TFInputLayer, BatchNormalization as TFBatchNorm

class CompatInputLayer(TFInputLayer):
    def __init__(self, batch_shape=None, **kwargs):
        if batch_shape is not None:
            kwargs.setdefault('batch_input_shape', batch_shape)
        super().__init__(**kwargs)

class CompatBatchNormalization(TFBatchNorm):
    def __init__(self, *args, **kwargs):
        # Some old models use 'synchronized' kwarg which isn't supported anymore
        kwargs.pop('synchronized', None)
        super().__init__(*args, **kwargs)

in_path = "fastapi_backend/models/deepfake_model.h5"
out_path = "fastapi_backend/models/deepfake_model_compat.h5"

print("Using Python:", __import__('sys').executable)
print("TensorFlow version:", tf.__version__)
print("Input model:", in_path)

custom = {"InputLayer": CompatInputLayer, "BatchNormalization": CompatBatchNormalization, "SyncBatchNormalization": CompatBatchNormalization}
try:
    policy_cls = tf.keras.mixed_precision.Policy
    custom.update({"DTypePolicy": policy_cls, "Policy": policy_cls})
    print("Mapped DTypePolicy -> tf.keras.mixed_precision.Policy")
except Exception:
    print("Could not map mixed precision policy; continuing without it")

try:
    print("Loading model with extended custom_objects (v3)...")
    m = tf.keras.models.load_model(in_path, compile=False, custom_objects=custom)
    print("Loaded model successfully. Saving to:", out_path)
    m.save(out_path)
    print("Saved compatible model successfully.")
except Exception as e:
    print("Failed to load or save model (v3):")
    traceback.print_exc()
    raise
