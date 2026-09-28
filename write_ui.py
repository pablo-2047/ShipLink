import os
from pathlib import Path

base_dir = Path('c:/Users/Pablo/Desktop/SIH/frontend/src/components')
(base_dir / 'layout').mkdir(parents=True, exist_ok=True)
(base_dir / 'dashboard').mkdir(parents=True, exist_ok=True)
print('Directories ready')
