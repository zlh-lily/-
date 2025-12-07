document.addEventListener('DOMContentLoaded', () => {
    const uploadSection = document.getElementById('upload-section');
    const previewSection = document.getElementById('preview-section');
    const resultSection = document.getElementById('result-section');
    const mainContent = document.getElementById('main-content');

    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-button');
    
    const previewContainer = document.getElementById('preview-container');
    const imageCount = document.getElementById('image-count');
    const addMoreButton = document.getElementById('add-more-button');
    const analyzeButton = document.getElementById('analyze-button');

    const loadingOverlay = document.getElementById('loading-overlay');

    let files = [];

    // --- Event Listeners ---
    selectButton.addEventListener('click', () => fileInput.click());
    addMoreButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);
    uploadArea.addEventListener('click', () => fileInput.click());

    analyzeButton.addEventListener('click', handleAnalysis);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        processFiles(droppedFiles);
    }

    function handleFiles(e) {
        const selectedFiles = e.target.files;
        processFiles(selectedFiles);
    }

    function processFiles(newFiles) {
        for (const file of newFiles) {
            if (file.type.startsWith('image/')) {
                files.push(file);
            }
        }
        updateUI();
    }

    function updateUI() {
        if (files.length === 0) {
            uploadSection.classList.remove('hidden');
            previewSection.classList.add('hidden');
        } else {
            uploadSection.classList.add('hidden');
            previewSection.classList.remove('hidden');
            renderPreviews();
        }
        imageCount.textContent = files.length;
        analyzeButton.disabled = files.length < 5;
    }

    function renderPreviews() {
        previewContainer.innerHTML = '';
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.classList.add('preview-item');
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="delete-btn" data-index="${index}">&times;</button>
                `;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    previewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            files.splice(index, 1);
            updateUI();
        }
    });

    async function handleAnalysis() {
        if (files.length < 5) {
            alert('请至少上传5张图片进行分析。');
            return;
        }

        loadingOverlay.classList.remove('hidden');

        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        try {
            // NOTE: Replace with your actual backend endpoint
            const response = await fetch('http://localhost:3000/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '分析失败，请稍后重试。');
            }

            const resultData = await response.json();
            displayResults(resultData);

        } catch (error) {
            console.error('Analysis error:', error);
            alert(`发生错误: ${error.message}`);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    function displayResults(data) {
        mainContent.classList.add('hidden');
        resultSection.classList.remove('hidden');
        resultSection.innerHTML = `
            <div class="result-card">
                <h3>性格特质</h3>
                <div class="tag-container">
                    ${data.personality.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="result-card">
                <h3>兴趣爱好</h3>
                <div class="tag-container">
                    ${data.hobbies.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="result-card">
                <h3>追求建议</h3>
                <ul class="suggestion-list">
                    ${data.pursuit_suggestions.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div class="result-card">
                <h3>聊天话题</h3>
                <ul class="suggestion-list">
                    ${data.chat_topics.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div class="result-card">
                <h3>约会建议</h3>
                <ul class="suggestion-list">
                    ${data.dating_suggestions.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div class="result-actions">
                <button id="re-analyze-button" class="btn-secondary">重新分析</button>
                <button id="share-button" class="btn">分享结果</button>
            </div>
        `;

        document.getElementById('re-analyze-button').addEventListener('click', () => {
            // Reset state
            files = [];
            resultSection.classList.add('hidden');
            mainContent.classList.remove('hidden');
            uploadSection.classList.remove('hidden');
            previewSection.classList.add('hidden');
            updateUI();
        });

        document.getElementById('share-button').addEventListener('click', () => {
            alert('分享功能正在开发中...');
        });
    }
});
