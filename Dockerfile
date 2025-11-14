# Dual Connect - Docker Image
# Nginx-based container for serving static HTML/CSS/JS

FROM nginx:alpine

# Set maintainer label
LABEL maintainer="Dual Connect Educational Project"
LABEL description="MVP platform for international families seeking dual education in Germany"

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files
COPY src/ /usr/share/nginx/html/

# Copy database sample data (needed for JSON loading)
COPY database/sample-data/ /usr/share/nginx/html/database/sample-data/

# Create necessary directories and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
