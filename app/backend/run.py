import sys
from argparse import ArgumentParser
from app import create_app

# For logs output
sys.stdout.reconfigure(line_buffering=True)



# ========== MAIN ==========

# DEBUG MODE
if __name__ == "__main__":
    parser = ArgumentParser(description="Debug mode of APP")
    app = create_app(debug=True)
    app.run(debug=True, host='localhost', port=8000)

# PRODUCTION MODE
else:
    # This app will be for gunicorn in production mode
    app = create_app()

# ==========================