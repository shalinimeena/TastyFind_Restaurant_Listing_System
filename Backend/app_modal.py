import modal

app = modal.App("tastyfind-app")

image = (
    modal.Image.debian_slim()
    .pip_install_from_requirements("requirements.txt")
    .add_local_dir(".", remote_path="/app")
)

# Load secrets from .env
secret = modal.Secret.from_dotenv()

@app.function(
    image=image,
    secrets=[secret],
    timeout=600,
)
@modal.asgi_app()
def fastapi_app():
    import sys
    sys.path.append("/app")  # Ensure /app is in sys.path
    import main_local
    return main_local.app  # main.app must be your FastAPI() instance


