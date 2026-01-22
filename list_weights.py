import h5py
p='fastapi_backend/models/deepfake_model.h5'
with h5py.File(p,'r') as f:
    if 'model_weights' in f:
        print('Layers under model_weights:')
        for k in f['model_weights'].keys():
            print('-', k)
    else:
        print('No model_weights')
