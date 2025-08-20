from app import create_app


app = create_app()


# MAIN (debug mode)
if __name__ == "__main__":
    app.run(ssl_context='adhoc', debug=True)
