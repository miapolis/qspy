# Begin frontend build
FROM node:14 AS FRONTEND_BUILD
WORKDIR /frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install dependencies
RUN npm install
COPY ./frontend ./

# Build React project and create static folder
RUN npm run build

# Begin internal build
FROM node:14 AS INTERNAL_BUILD
WORKDIR /QSpy
# Copy React build output 
COPY --from=FRONTEND_BUILD ./frontend/build ./frontend/build

COPY ./internal/package.json ./internal/package-lock.json ./internal/
COPY ./internal ./internal

# Install server dependencies
WORKDIR /QSpy/internal 
RUN npm install

# Start
EXPOSE 5000
CMD  [ "npm", "start" ]