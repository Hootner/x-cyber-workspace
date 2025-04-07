# Stage 1: Build the React frontend
FROM node:18 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build the Node.js backend
FROM node:18 AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# Stage 3: Final image with Nginx and Node.js
FROM nginx:alpine
# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
# Copy the built frontend
COPY --from=frontend-build /app/client/build /usr/share/nginx/html
# Copy the backend
COPY --from=backend-build /app/server /app/server
# Install Node.js in the final image
RUN apk add --update nodejs npm
# Expose ports
EXPOSE 80 3000
# Start Nginx and Node.js
CMD ["sh", "-c", "cd /app/server && npm start & nginx -g 'daemon off;'"]