import h5py, json
p='fastapi_backend/models/deepfake_model.h5'
with h5py.File(p,'r') as f:
    print('Top keys:', list(f.keys()))
    if 'model_config' in f:
        raw = f['model_config'][()]
        if isinstance(raw, bytes):
            raw = raw.decode('utf-8')
        cfg=json.loads(raw)
        print('model_config keys:', list(cfg.keys()))
        layers = cfg.get('config', {}).get('layers', [])
        print('Number of layers in config:', len(layers))
        for i, l in enumerate(layers[:20]):
            print(i, l.get('class_name'), list(l.get('config', {}).keys())[:12])
            if l.get('class_name') == 'InputLayer':
                print('InputLayer config sample:', l.get('config'))
                break
    else:
        print('No model_config found in HDF5')
