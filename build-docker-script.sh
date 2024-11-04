docker-compose stop api
docker-compose rm -f api
docker-compose build api
docker-compose up -d api
