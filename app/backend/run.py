import sys
from app import create_app

sys.stdout.reconfigure(line_buffering=True)

app = create_app()

# MAIN (debug mode)
if __name__ == "__main__":
    app.run(debug=True)
