# source .env
# cd frontend
# npm run build
# npm start

source .env
. venv/bin/activate && \
supervisord -c supervisord.conf