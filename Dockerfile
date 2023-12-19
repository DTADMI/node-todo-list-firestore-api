FROM node:21-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN  npm install

# Copy local code to the container
COPY . .

# Start the service in the container
# The build was directly included in this one
CMD npm run start