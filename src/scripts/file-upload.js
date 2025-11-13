// File Upload Utility

class FileUploader {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB default
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      multiple: options.multiple || false,
      endpoint: options.endpoint || '/api/upload',
      onProgress: options.onProgress || (() => {}),
      onSuccess: options.onSuccess || (() => {}),
      onError: options.onError || (() => {})
    };
  }

  // Validate file
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.options.maxSize) {
      errors.push(`File size exceeds ${this.options.maxSize / 1024 / 1024}MB limit`);
    }

    // Check file type
    if (!this.options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Upload single file
  async uploadFile(file, additionalData = {}) {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.options.onError(validation.errors);
      throw new Error(validation.errors.join(', '));
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Add additional data
    for (const key in additionalData) {
      formData.append(key, additionalData[key]);
    }

    try {
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          this.options.onProgress(percentComplete);
        }
      });

      // Return promise
      return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            this.options.onSuccess(response);
            resolve(response);
          } else {
            const error = xhr.statusText || 'Upload failed';
            this.options.onError(error);
            reject(new Error(error));
          }
        });

        xhr.addEventListener('error', () => {
          const error = 'Network error during upload';
          this.options.onError(error);
          reject(new Error(error));
        });

        xhr.open('POST', this.options.endpoint);

        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    } catch (error) {
      this.options.onError(error.message);
      throw error;
    }
  }

  // Upload multiple files
  async uploadFiles(files, additionalData = {}) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(files[i], {
          ...additionalData,
          fileIndex: i
        });
        results.push(result);
      } catch (error) {
        results.push({ error: error.message, file: files[i].name });
      }
    }

    return results;
  }
}

// File Upload UI Component
class FileUploadUI {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      ...options,
      onFileSelect: options.onFileSelect || (() => {}),
      onUploadComplete: options.onUploadComplete || (() => {})
    };

    this.uploader = new FileUploader(options);
    this.selectedFiles = [];

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="file-upload-component">
        <div class="file-upload-dropzone" id="dropzone">
          <input type="file" id="fileInput"
                 ${this.options.multiple ? 'multiple' : ''}
                 accept="${this.options.allowedTypes?.join(',') || '*'}"
                 style="display: none;">
          <div class="dropzone-content">
            <div class="upload-icon">📁</div>
            <p class="upload-text">Drag & drop files here or click to browse</p>
            <p class="upload-hint">
              Max size: ${this.options.maxSize / 1024 / 1024}MB
              ${this.options.allowedTypes ? `<br>Allowed: ${this.getAllowedTypesText()}` : ''}
            </p>
          </div>
        </div>

        <div id="fileList" class="file-list"></div>

        <div id="uploadProgress" class="upload-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <p class="progress-text" id="progressText">0%</p>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const dropzone = this.container.querySelector('#dropzone');
    const fileInput = this.container.querySelector('#fileInput');

    // Click to browse
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });
  }

  handleFiles(files) {
    this.selectedFiles = Array.from(files);
    this.displayFileList();
    this.options.onFileSelect(this.selectedFiles);
  }

  displayFileList() {
    const fileList = this.container.querySelector('#fileList');

    if (this.selectedFiles.length === 0) {
      fileList.innerHTML = '';
      return;
    }

    fileList.innerHTML = this.selectedFiles.map((file, index) => `
      <div class="file-item" data-index="${index}">
        <div class="file-info">
          <span class="file-icon">${this.getFileIcon(file.type)}</span>
          <div class="file-details">
            <p class="file-name">${file.name}</p>
            <p class="file-size">${this.formatFileSize(file.size)}</p>
          </div>
        </div>
        <button class="btn-remove" onclick="fileUploadUI.removeFile(${index})">&times;</button>
      </div>
    `).join('');
  }

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.displayFileList();
  }

  async uploadFiles(additionalData = {}) {
    if (this.selectedFiles.length === 0) {
      throw new Error('No files selected');
    }

    const progressContainer = this.container.querySelector('#uploadProgress');
    const progressFill = this.container.querySelector('#progressFill');
    const progressText = this.container.querySelector('#progressText');

    progressContainer.style.display = 'block';

    try {
      const results = [];

      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];

        const result = await this.uploader.uploadFile(file, {
          ...additionalData,
          fileName: file.name
        });

        results.push(result);

        // Update overall progress
        const overallProgress = Math.round(((i + 1) / this.selectedFiles.length) * 100);
        progressFill.style.width = `${overallProgress}%`;
        progressText.textContent = `${overallProgress}%`;
      }

      this.options.onUploadComplete(results);
      this.selectedFiles = [];
      this.displayFileList();

      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
      }, 2000);

      return results;
    } catch (error) {
      progressContainer.style.display = 'none';
      throw error;
    }
  }

  getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getAllowedTypesText() {
    const types = this.options.allowedTypes || [];
    const extensions = types.map(type => {
      if (type === 'application/pdf') return 'PDF';
      if (type.startsWith('image/')) return type.split('/')[1].toUpperCase();
      return type;
    });
    return extensions.join(', ');
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FileUploader,
    FileUploadUI
  };
}

// Global instance for onclick handlers
let fileUploadUI;

// Example usage:
/*
const container = document.getElementById('uploadContainer');

fileUploadUI = new FileUploadUI(container, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  multiple: true,
  endpoint: '/api/upload/documents',
  onFileSelect: (files) => {
    console.log('Files selected:', files);
  },
  onProgress: (percent) => {
    console.log('Upload progress:', percent + '%');
  },
  onUploadComplete: (results) => {
    console.log('Upload complete:', results);
  },
  onError: (error) => {
    console.error('Upload error:', error);
  }
});

// Later, trigger upload
document.getElementById('uploadBtn').addEventListener('click', async () => {
  try {
    const results = await fileUploadUI.uploadFiles({
      documentType: 'cv',
      userId: '123'
    });
    console.log('All files uploaded:', results);
  } catch (error) {
    console.error('Upload failed:', error);
  }
});
*/
