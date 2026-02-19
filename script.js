// script.js
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const cursorPosition = document.getElementById('cursor-position');
    const languageIndicator = document.getElementById('language-indicator');
    const tabBtn = document.getElementById('tab-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const bracketBtn = document.getElementById('bracket-btn');
    const searchBtn = document.getElementById('search-btn');
    const cursorUpBtn = document.getElementById('cursor-up-btn');
    const cursorDownBtn = document.getElementById('cursor-down-btn');
    const cursorLeftBtn = document.getElementById('cursor-left-btn');
    const cursorRightBtn = document.getElementById('cursor-right-btn');
    const selectBtn = document.getElementById('select-btn');
    const selectAllBtn = document.getElementById('select-all-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const fileListContainer = document.getElementById('file-list');
    const customPopup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupConfirm = document.getElementById('popup-confirm');
    const popupCancel = document.getElementById('popup-cancel');
    const runBtn = document.getElementById('run-btn');
    const previewModal = document.getElementById('preview-modal');
    const previewIframe = document.getElementById('preview-iframe');
    const previewModalCloseBtn = document.getElementById('preview-modal-close-btn');
    const activeFilesBar = document.getElementById('active-files');

    // --- State ---
    let editor;
    let currentProject = null;
    let activeFilePath = null;
    let _projectRootPath = null;        // Cached project root path
    let openTabs = [];                  // [{path, name, model, saveTimer}]
    const fs = window.FileSystem;
    let contextMenuTarget = null;
    let clipboard = null;               // {path, type, operation: 'copy'|'cut'}


    // =========================================================================
    // --- Project Root Path (Cached) ---
    // =========================================================================

    async function getProjectRootPath() {
        if (_projectRootPath) return _projectRootPath;
        const projects = await fs.listProjects();
        const project = projects.find(p => p.name === currentProject);
        _projectRootPath = project ? project.path : '';
        return _projectRootPath;
    }

    function getRelativePath(absolutePath) {
        if (!_projectRootPath) return absolutePath;
        return absolutePath.replace(_projectRootPath + '/', '');
    }


    // =========================================================================
    // --- Project Loading ---
    // =========================================================================

    async function loadProjectFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectName = urlParams.get('project');

        if (!projectName) {
            window.location.href = 'dashboard.html';
            return;
        }

        currentProject = projectName;

        if (fs) {
            document.querySelector('header h1').innerHTML = `<i class="fas fa-folder-open"></i> ${projectName}`;
            await getProjectRootPath(); // Pre-cache on load
            refreshFileTree();
            const fileTree = await fs.listProjectContents(projectName);
            const firstFile = findDefaultFile(fileTree);
            if (firstFile) {
                openFile(firstFile.path);
            }
        } else {
            fileListContainer.innerHTML = '<p style="padding: 10px; color: var(--error);">FileSystem API not available.</p>';
        }
    }

    async function refreshFileTree() {
        if (currentProject && fs) {
            const fileTree = await fs.listProjectContents(currentProject);
            renderFileTree(fileTree, fileListContainer);
            // Re-highlight the active file after tree re-renders
            if (activeFilePath) updateActiveFileUI(activeFilePath);
        }
    }

    // FIX: Check all root-level files first THEN recurse into folders
    // (previously could find a deeply-nested file over a root-level preferred file)
    function findDefaultFile(nodes) {
        for (const node of nodes) {
            if (node.type === 'file' && (node.name === 'index.html' || node.name === 'main.js' || node.name === 'main.ryx')) {
                return node;
            }
        }
        for (const node of nodes) {
            if (node.type === 'folder' && node.children) {
                const found = findDefaultFile(node.children);
                if (found) return found;
            }
        }
        return null;
    }

    // Recursive helper to find any file by name in the full tree
    function findFileInTree(nodes, filename) {
        for (const node of nodes) {
            if (node.type === 'file' && node.name === filename) return node;
        }
        for (const node of nodes) {
            if (node.type === 'folder' && node.children) {
                const found = findFileInTree(node.children, filename);
                if (found) return found;
            }
        }
        return null;
    }


    // =========================================================================
    // --- File Tree Rendering ---
    // =========================================================================

    function renderFileTree(nodes, container) {
        const isUL = container.tagName === 'UL';
        const tree = isUL ? container : document.createElement('ul');

        if (isUL) {
            tree.innerHTML = ''; // Clear for recursive re-renders
        } else {
            tree.className = 'file-tree';
            container.innerHTML = '';
        }

        nodes.forEach(node => {
            const li = document.createElement('li');
            li.className = 'file-tree-item-container';

            const itemButton = document.createElement('button');
            itemButton.className = 'file-tree-item';
            itemButton.dataset.path = node.path;
            itemButton.dataset.type = node.type;

            const leftGroup = document.createElement('div');
            leftGroup.style.cssText = 'display:flex;align-items:center;gap:8px;overflow:hidden;min-width:0;flex:1;';

            if (node.type === 'folder') {
                const caretIcon = document.createElement('i');
                caretIcon.className = 'fas fa-chevron-right folder-caret';
                leftGroup.appendChild(caretIcon);

                const folderIcon = document.createElement('i');
                folderIcon.className = 'fas fa-folder folder-icon';
                leftGroup.appendChild(folderIcon);

                itemButton.addEventListener('click', () => toggleFolder(li, caretIcon));
            } else {
                const placeholder = document.createElement('i');
                placeholder.className = 'fas fa-chevron-right folder-caret';
                placeholder.style.visibility = 'hidden';
                leftGroup.appendChild(placeholder);

                const fileIcon = document.createElement('i');
                const iconInfo = getFileIcon(node.name);
                fileIcon.className = `${iconInfo.icon} file-icon ${iconInfo.colorClass}`;
                fileIcon.title = iconInfo.tooltip;
                leftGroup.appendChild(fileIcon);

                itemButton.addEventListener('click', () => openFile(node.path));
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = node.name;
            nameSpan.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            leftGroup.appendChild(nameSpan);

            itemButton.appendChild(leftGroup);

            const moreBtn = document.createElement('button');
            moreBtn.className = 'file-options-btn';
            moreBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
            moreBtn.title = 'More options';
            moreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showContextMenu(e, node.path, node.type);
            });

            itemButton.appendChild(moreBtn);
            li.appendChild(itemButton);

            if (node.type === 'folder' && node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('ul');
                li.appendChild(childrenContainer);
                renderFileTree(node.children, childrenContainer);
            }

            tree.appendChild(li);
        });

        if (!isUL) {
            container.appendChild(tree);
        }
    }

    function toggleFolder(li_container, caret_icon) {
        li_container.classList.toggle('open');
        caret_icon.classList.toggle('open');
    }


    // =========================================================================
    // --- File Icons ---
    // =========================================================================

    const fileIconMap = {
        // Programming Languages
        js:     { icon: 'fab fa-js-square',     colorClass: 'icon-js',     tooltip: 'JavaScript' },
        ts:     { icon: 'fas fa-file-code',      colorClass: 'icon-ts',     tooltip: 'TypeScript' },
        py:     { icon: 'fab fa-python',         colorClass: 'icon-py',     tooltip: 'Python' },
        java:   { icon: 'fab fa-java',           colorClass: 'icon-java',   tooltip: 'Java' },
        cs:     { icon: 'fas fa-file-code',      colorClass: 'icon-cs',     tooltip: 'C#' },
        cpp:    { icon: 'fas fa-file-code',      colorClass: 'icon-cpp',    tooltip: 'C++' },
        c:      { icon: 'fas fa-file-code',      colorClass: 'icon-c',      tooltip: 'C' },
        html:   { icon: 'fab fa-html5',          colorClass: 'icon-html',   tooltip: 'HTML' },
        css:    { icon: 'fab fa-css3-alt',       colorClass: 'icon-css',    tooltip: 'CSS' },
        scss:   { icon: 'fab fa-sass',           colorClass: 'icon-scss',   tooltip: 'SCSS' },
        sass:   { icon: 'fab fa-sass',           colorClass: 'icon-sass',   tooltip: 'SASS' },
        php:    { icon: 'fab fa-php',            colorClass: 'icon-php',    tooltip: 'PHP' },
        rb:     { icon: 'fas fa-gem',            colorClass: 'icon-rb',     tooltip: 'Ruby' },
        go:     { icon: 'fab fa-golang',         colorClass: 'icon-go',     tooltip: 'Go' },
        rs:     { icon: 'fab fa-rust',           colorClass: 'icon-rs',     tooltip: 'Rust' },
        swift:  { icon: 'fab fa-swift',          colorClass: 'icon-swift',  tooltip: 'Swift' },
        kt:     { icon: 'fab fa-kickstarter-k',  colorClass: 'icon-kt',     tooltip: 'Kotlin' },
        dart:   { icon: 'fas fa-file-code',      colorClass: 'icon-dart',   tooltip: 'Dart' },
        r:      { icon: 'fab fa-r-project',      colorClass: 'icon-r',      tooltip: 'R' },
        m:      { icon: 'fas fa-file-code',      colorClass: 'icon-m',      tooltip: 'MATLAB/Objective-C' },
        pl:     { icon: 'fas fa-file-code',      colorClass: 'icon-pl',     tooltip: 'Perl' },
        sh:     { icon: 'fas fa-terminal',       colorClass: 'icon-sh',     tooltip: 'Shell Script' },
        ps1:    { icon: 'fas fa-terminal',       colorClass: 'icon-ps1',    tooltip: 'PowerShell' },
        sql:    { icon: 'fas fa-database',       colorClass: 'icon-sql',    tooltip: 'SQL' },
        vue:    { icon: 'fab fa-vuejs',          colorClass: 'icon-vue',    tooltip: 'Vue' },
        jsx:    { icon: 'fab fa-react',          colorClass: 'icon-jsx',    tooltip: 'React JSX' },
        tsx:    { icon: 'fab fa-react',          colorClass: 'icon-tsx',    tooltip: 'React TSX' },
        svelte: { icon: 'fas fa-file-code',      colorClass: 'icon-svelte', tooltip: 'Svelte' },
        lua:    { icon: 'fas fa-file-code',      colorClass: 'icon-lua',    tooltip: 'Lua' },
        scala:  { icon: 'fas fa-file-code',      colorClass: 'icon-scala',  tooltip: 'Scala' },
        hs:     { icon: 'fas fa-file-code',      colorClass: 'icon-hs',     tooltip: 'Haskell' },
        clj:    { icon: 'fas fa-file-code',      colorClass: 'icon-clj',    tooltip: 'Clojure' },
        ex:     { icon: 'fas fa-file-code',      colorClass: 'icon-ex',     tooltip: 'Elixir' },
        erl:    { icon: 'fas fa-file-code',      colorClass: 'icon-erl',    tooltip: 'Erlang' },
        fs:     { icon: 'fas fa-file-code',      colorClass: 'icon-fs',     tooltip: 'F#' },
        vb:     { icon: 'fas fa-file-code',      colorClass: 'icon-vb',     tooltip: 'Visual Basic' },
        asm:    { icon: 'fas fa-microchip',      colorClass: 'icon-asm',    tooltip: 'Assembly' },
        cob:    { icon: 'fas fa-file-code',      colorClass: 'icon-cob',    tooltip: 'COBOL' },
        f90:    { icon: 'fas fa-file-code',      colorClass: 'icon-f90',    tooltip: 'Fortran' },
        ada:    { icon: 'fas fa-file-code',      colorClass: 'icon-ada',    tooltip: 'Ada' },
        pas:    { icon: 'fas fa-file-code',      colorClass: 'icon-pas',    tooltip: 'Pascal' },
        rzn:    { icon: 'fas fa-file-code',      colorClass: 'icon-rzn',    tooltip: 'Ryx' },
        ryx:    { icon: 'fas fa-file-code',      colorClass: 'icon-rzn',    tooltip: 'Ryx' },
        // Data & Config
        json:   { icon: 'fas fa-file-alt',       colorClass: 'icon-json',   tooltip: 'JSON' },
        xml:    { icon: 'fas fa-file-code',      colorClass: 'icon-xml',    tooltip: 'XML' },
        yml:    { icon: 'fas fa-file-alt',       colorClass: 'icon-yml',    tooltip: 'YAML' },
        yaml:   { icon: 'fas fa-file-alt',       colorClass: 'icon-yaml',   tooltip: 'YAML' },
        md:     { icon: 'fab fa-markdown',       colorClass: 'icon-md',     tooltip: 'Markdown' },
        mdx:    { icon: 'fab fa-markdown',       colorClass: 'icon-mdx',    tooltip: 'MDX' },
        config: { icon: 'fas fa-cog',            colorClass: 'icon-config', tooltip: 'Config' },
        ini:    { icon: 'fas fa-cog',            colorClass: 'icon-ini',    tooltip: 'INI' },
        env:    { icon: 'fas fa-cog',            colorClass: 'icon-env',    tooltip: 'Environment' },
        // Documents & Images
        pdf:    { icon: 'fas fa-file-pdf',       colorClass: 'icon-pdf',    tooltip: 'PDF' },
        doc:    { icon: 'fas fa-file-word',      colorClass: 'icon-doc',    tooltip: 'Word Document' },
        docx:   { icon: 'fas fa-file-word',      colorClass: 'icon-docx',   tooltip: 'Word Document' },
        txt:    { icon: 'fas fa-file-alt',       colorClass: 'icon-txt',    tooltip: 'Text File' },
        png:    { icon: 'fas fa-file-image',     colorClass: 'icon-png',    tooltip: 'PNG Image' },
        jpg:    { icon: 'fas fa-file-image',     colorClass: 'icon-jpg',    tooltip: 'JPEG Image' },
        jpeg:   { icon: 'fas fa-file-image',     colorClass: 'icon-jpeg',   tooltip: 'JPEG Image' },
        svg:    { icon: 'fas fa-file-image',     colorClass: 'icon-svg',    tooltip: 'SVG Image' },
        // Archives & Other
        zip:    { icon: 'fas fa-file-archive',   colorClass: 'icon-zip',    tooltip: 'ZIP Archive' },
        tar:    { icon: 'fas fa-file-archive',   colorClass: 'icon-tar',    tooltip: 'TAR Archive' },
        gz:     { icon: 'fas fa-file-archive',   colorClass: 'icon-gz',     tooltip: 'Gzip Archive' },
        db:     { icon: 'fas fa-database',       colorClass: 'icon-db',     tooltip: 'Database' },
        sqlite: { icon: 'fas fa-database',       colorClass: 'icon-sqlite', tooltip: 'SQLite DB' },
        lock:   { icon: 'fas fa-lock',           colorClass: 'icon-lock',   tooltip: 'Lock File' },
        log:    { icon: 'fas fa-file-alt',       colorClass: 'icon-log',    tooltip: 'Log File' },
    };

    function getFileIcon(filename) {
        const lower = filename.toLowerCase();
        if (lower === 'readme.md') return { icon: 'fas fa-book-open', colorClass: 'icon-readme', tooltip: 'README' };
        if (lower === 'license')   return { icon: 'fas fa-id-badge',  colorClass: 'icon-license', tooltip: 'License' };
        // FIX: guard against files with no extension (split returns the full name)
        const extension = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
        return fileIconMap[extension] || { icon: 'fas fa-file-alt', colorClass: 'icon-default', tooltip: 'File' };
    }


    // =========================================================================
    // --- Tab System ---
    // =========================================================================

    function renderTabs() {
        activeFilesBar.innerHTML = '';

        openTabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'active-file' + (tab.path === activeFilePath ? ' active' : '');
            tabEl.dataset.path = tab.path;
            tabEl.title = tab.path;

            const iconInfo = getFileIcon(tab.name);

            tabEl.innerHTML = `
                <i class="${iconInfo.icon} ${iconInfo.colorClass}" style="font-size:0.78rem;flex-shrink:0;"></i>
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;">${tab.name}</span>
                <button class="tab-close-btn" title="Close" style="
                    background:none;border:none;cursor:pointer;padding:0 0 0 4px;
                    color:var(--text-secondary);display:flex;align-items:center;flex-shrink:0;
                    border-radius:var(--radius-xs);line-height:1;font-size:0.75rem;
                "><i class="fas fa-times"></i></button>
            `;

            // Click tab to switch
            tabEl.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-close-btn')) {
                    switchToTab(tab.path);
                }
            });

            // Close button
            tabEl.querySelector('.tab-close-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(tab.path);
            });

            // Middle-click to close
            tabEl.addEventListener('mousedown', (e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    closeTab(tab.path);
                }
            });

            activeFilesBar.appendChild(tabEl);
        });

        // Scroll active tab into view
        const activeTabEl = activeFilesBar.querySelector('.active-file.active');
        if (activeTabEl) activeTabEl.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
    }

    function switchToTab(filePath) {
        const tab = openTabs.find(t => t.path === filePath);
        if (!tab || !editor) return;

        editor.setModel(tab.model);
        activeFilePath = filePath;

        const langId = detectLanguageFromExtension(filePath);
        languageIndicator.textContent = getLanguageName(langId);

        updateActiveFileUI(filePath);
        renderTabs();
        editor.focus();
    }

    function closeTab(filePath) {
        const idx = openTabs.findIndex(t => t.path === filePath);
        if (idx === -1) return;

        const tab = openTabs[idx];
        if (tab.saveTimer) clearTimeout(tab.saveTimer);
        tab.model.dispose();
        openTabs.splice(idx, 1);

        if (openTabs.length === 0) {
            // No tabs left — show the welcome screen model
            if (editor) {
                const welcomeModel = monaco.editor.createModel(
                    '// Welcome to Ryx Studio\n// Open a file from the sidebar to start editing.',
                    'plaintext'
                );
                editor.setModel(welcomeModel);
            }
            activeFilePath = null;
            languageIndicator.textContent = 'Plain Text';
            updateActiveFileUI(null);
            renderTabs();
        } else {
            // Switch to the nearest remaining tab
            const nextIdx = Math.min(idx, openTabs.length - 1);
            switchToTab(openTabs[nextIdx].path);
        }
    }


    // =========================================================================
    // --- File Operations ---
    // =========================================================================

    async function openFile(filePath) {
        if (!currentProject) return;

        // If file is already open, just switch to its tab
        const existingTab = openTabs.find(t => t.path === filePath);
        if (existingTab) {
            switchToTab(filePath);
            return;
        }

        await getProjectRootPath();
        const relativePath = getRelativePath(filePath);
        const content = await fs.readFile(currentProject, relativePath);

        if (typeof content === 'string' && !content.startsWith('Error:')) {
            const languageId = detectLanguageFromExtension(filePath);
            const fileName = filePath.split('/').pop();

            // Create a dedicated Monaco model for this file
            const model = monaco.editor.createModel(content, languageId);

            // Auto-save with 500ms debounce per model — fixes the every-keystroke write
            model.onDidChangeContent(() => {
                const tab = openTabs.find(t => t.path === filePath);
                if (!tab) return;
                if (tab.saveTimer) clearTimeout(tab.saveTimer);
                tab.saveTimer = setTimeout(async () => {
                    const rel = getRelativePath(filePath);
                    await fs.writeFile(currentProject, rel, model.getValue());
                }, 500);
            });

            const newTab = { path: filePath, name: fileName, model, saveTimer: null };
            openTabs.push(newTab);

            editor.setModel(model);
            activeFilePath = filePath;
            languageIndicator.textContent = getLanguageName(languageId);

            updateActiveFileUI(filePath);
            renderTabs();
            editor.focus();
        } else {
            showPopup('Error', `Could not open file: ${content}`, { showCancel: false });
        }
    }

    function updateActiveFileUI(filePath) {
        document.querySelectorAll('.file-tree-item').forEach(item => {
            item.classList.toggle('active', item.dataset.path === filePath);
        });
    }


    // =========================================================================
    // --- Toolbar Buttons ---
    // =========================================================================

    function addToolbarButtonListener(button, action) {
        if (button) {
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (editor) {
                    action(editor);
                    editor.focus();
                }
            });
        }
    }

    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    sidebarCloseBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    document.getElementById('new-file-btn').addEventListener('click', () => createNewItem('file'));
    document.getElementById('new-folder-btn').addEventListener('click', () => createNewItem('folder'));
    document.getElementById('import-files-btn').addEventListener('click', () => {
        showPopup('Not Implemented', 'File import is not yet available.', { showCancel: false });
    });

    async function createNewItem(type) {
        const promptMessage = type === 'file' ? 'Enter new filename:' : 'Enter new folder name:';
        const itemName = await showInputPopup(promptMessage);
        if (itemName) {
            const result = type === 'file'
                ? await fs.createFile(currentProject, itemName)
                : await fs.createFolder(currentProject, itemName);
            if (result.success) {
                refreshFileTree();
            } else {
                showPopup('Error', `Could not create ${type}: ${result.message}`, { showCancel: false });
            }
        }
    }

    // FIXED: Previously stacked event listeners on every call (memory leak + wrong behavior)
    function showInputPopup(message) {
        const popup = document.getElementById('filename-popup');
        const input = document.getElementById('filename-input');
        const confirmBtn = document.getElementById('filename-confirm');
        const cancelBtn = document.getElementById('filename-cancel');

        popup.querySelector('p').textContent = message;
        input.value = '';
        popup.style.display = 'flex';
        input.focus();

        return new Promise((resolve) => {
            const doConfirm = () => {
                const val = input.value.trim();
                popup.style.display = 'none';
                cleanup();
                resolve(val || null);
            };
            const doCancel = () => {
                popup.style.display = 'none';
                cleanup();
                resolve(null);
            };
            const onKeydown = (e) => {
                if (e.key === 'Enter') doConfirm();
                if (e.key === 'Escape') doCancel();
            };
            const cleanup = () => {
                confirmBtn.removeEventListener('click', doConfirm);
                cancelBtn.removeEventListener('click', doCancel);
                input.removeEventListener('keydown', onKeydown);
            };
            confirmBtn.addEventListener('click', doConfirm);
            cancelBtn.addEventListener('click', doCancel);
            input.addEventListener('keydown', onKeydown);
        });
    }

    // Editor action buttons
    addToolbarButtonListener(copyBtn,       (ed) => navigator.clipboard.writeText(ed.getValue()));
    addToolbarButtonListener(undoBtn,       (ed) => ed.trigger('toolbar', 'undo'));
    addToolbarButtonListener(redoBtn,       (ed) => ed.trigger('toolbar', 'redo'));
    addToolbarButtonListener(tabBtn,        (ed) => ed.executeEdits('toolbar', [{ range: ed.getSelection(), text: '  ', forceMoveMarkers: true }]));
    addToolbarButtonListener(bracketBtn,    (ed) => ed.getContribution('snippetController2')?.insert('($0)'));
    addToolbarButtonListener(searchBtn,     (ed) => ed.getAction('editor.action.startFindReplaceAction').run());
    addToolbarButtonListener(cursorUpBtn,   (ed) => ed.trigger('toolbar', 'cursorUp', null));
    addToolbarButtonListener(cursorDownBtn, (ed) => ed.trigger('toolbar', 'cursorDown', null));
    addToolbarButtonListener(cursorLeftBtn, (ed) => ed.trigger('toolbar', 'cursorLeft', null));
    addToolbarButtonListener(cursorRightBtn,(ed) => ed.trigger('toolbar', 'cursorRight', null));
    addToolbarButtonListener(selectBtn,     (ed) => ed.getAction('editor.action.smartSelect.expand').run());
    addToolbarButtonListener(selectAllBtn,  (ed) => ed.getAction('editor.action.selectAll').run());


    // =========================================================================
    // --- Theme Toggle ---
    // =========================================================================

    themeToggle.addEventListener('click', toggleTheme);

    function toggleTheme() {
        const isLightTheme = document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', isLightTheme ? 'light-theme' : 'dark-theme');
        if (editor) monaco.editor.setTheme(isLightTheme ? 'razen-light' : 'razen-dark');
        // FIX: Toggle the icon between sun and moon
        const icon = themeToggle.querySelector('i');
        if (icon) icon.className = isLightTheme ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Set the correct icon on initial page load
    (function initThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (icon && document.body.classList.contains('light-theme')) {
            icon.className = 'fas fa-sun';
        }
    })();


    // =========================================================================
    // --- Preview / Run ---
    // =========================================================================

    runBtn.addEventListener('click', () => runCode());

    previewModalCloseBtn.addEventListener('click', () => {
        previewModal.style.display = 'none';
        previewIframe.srcdoc = '';
    });

    // Close preview modal on background click
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
            previewIframe.srcdoc = '';
        }
    });

    // FIX: Preview mode buttons were defined in HTML but had NO listeners — now wired up
    const previewModeDesktop = document.getElementById('preview-mode-desktop');
    const previewModeMobile  = document.getElementById('preview-mode-mobile');
    const previewModeCustom  = document.getElementById('preview-mode-custom');
    const previewModalContent = document.querySelector('.preview-modal-content');

    function setPreviewMode(mode) {
        if (!previewModalContent) return;
        previewModalContent.classList.remove('preview-desktop', 'preview-mobile', 'preview-custom');
        previewModalContent.classList.add(`preview-${mode}`);
        [previewModeDesktop, previewModeMobile, previewModeCustom].forEach(btn => btn && btn.classList.remove('active'));
        const activeBtn = { desktop: previewModeDesktop, mobile: previewModeMobile, custom: previewModeCustom }[mode];
        if (activeBtn) activeBtn.classList.add('active');
    }

    previewModeDesktop && previewModeDesktop.addEventListener('click', () => setPreviewMode('desktop'));
    previewModeMobile  && previewModeMobile.addEventListener('click',  () => setPreviewMode('mobile'));
    previewModeCustom  && previewModeCustom.addEventListener('click',  () => setPreviewMode('custom'));

    async function runCode(filePath) {
        if (!currentProject) {
            showPopup('Error', 'No project is currently open.', { showCancel: false });
            return;
        }

        const path = filePath || activeFilePath;
        if (!path) {
            showPopup('Error', 'No file selected for preview.', { showCancel: false });
            return;
        }

        const lowerCasePath = path.toLowerCase();
        const isMarkdown = lowerCasePath.endsWith('.md') || lowerCasePath.endsWith('.mdx');
        const isHtml = lowerCasePath.endsWith('.html');

        // FIX: If not a previewable file, use recursive findFileInTree (not just root-level find)
        if (!isMarkdown && !isHtml) {
            const projectContents = await fs.listProjectContents(currentProject);
            const indexFile = findFileInTree(projectContents, 'index.html');
            if (indexFile) {
                runCode(indexFile.path);
            } else {
                showPopup('Error', 'Could not find a file to preview. Please open an HTML or Markdown file.', { showCancel: false });
            }
            return;
        }

        try {
            await getProjectRootPath();
            const relativePath = getRelativePath(path);
            const content = await fs.readFile(currentProject, relativePath);

            if (typeof content !== 'string' || content.startsWith('Error:')) {
                showPopup('Error', `Could not read file: ${content}`, { showCancel: false });
                return;
            }

            let finalHtml;

            if (isMarkdown) {
                const convertedHtml = marked.parse(content);
                finalHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Markdown Preview</title>
<style>
    body { font-family: sans-serif; line-height: 1.7; padding: 20px; max-width: 820px; margin: 0 auto; }
    .theme-dark { background-color: #1a1b26; color: #c0caf5; }
    .theme-dark code { background: #24283b; }
    pre { background: #24283b; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { font-family: monospace; }
    img { max-width: 100%; }
</style></head>
<body class="${document.body.classList.contains('light-theme') ? '' : 'theme-dark'}">
${convertedHtml}
</body></html>`;
            } else {
                // HTML: inline local CSS and JS files
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const basePath = relativePath.includes('/')
                    ? relativePath.substring(0, relativePath.lastIndexOf('/') + 1)
                    : '';

                const processPromises = [];

                // FIX: Use simple basePath concatenation instead of fragile new URL('file:///...')
                doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('http:') && !href.startsWith('https:') && !href.startsWith('//') && !href.startsWith('data:')) {
                        const cssPath = basePath + href;
                        processPromises.push(
                            fs.readFile(currentProject, cssPath).then(cssContent => {
                                if (typeof cssContent === 'string' && !cssContent.startsWith('Error:')) {
                                    const style = doc.createElement('style');
                                    style.textContent = cssContent;
                                    link.replaceWith(style);
                                }
                            }).catch(() => {})
                        );
                    }
                });

                doc.querySelectorAll('script[src]').forEach(script => {
                    const src = script.getAttribute('src');
                    if (src && !src.startsWith('http:') && !src.startsWith('https:') && !src.startsWith('//') && !src.startsWith('data:')) {
                        const jsPath = basePath + src;
                        processPromises.push(
                            fs.readFile(currentProject, jsPath).then(jsContent => {
                                if (typeof jsContent === 'string' && !jsContent.startsWith('Error:')) {
                                    const newScript = doc.createElement('script');
                                    newScript.textContent = jsContent;
                                    script.parentNode.replaceChild(newScript, script);
                                }
                            }).catch(() => {})
                        );
                    }
                });

                await Promise.all(processPromises);
                finalHtml = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
            }

            previewIframe.srcdoc = finalHtml;
            previewModal.style.display = 'flex';
            setPreviewMode('desktop'); // Default to desktop when opening

        } catch (error) {
            console.error('Error during preview generation:', error);
            showPopup('Preview Error', `An unexpected error occurred: ${error.message}`, { showCancel: false });
        }
    }


    // =========================================================================
    // --- Popups ---
    // FIXED: Previously stacked onclick handlers on every call — now uses
    // addEventListener with proper cleanup so old promises can't ghost.
    // =========================================================================

    function showPopup(title, message, options = {}) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;

        const isAlert = options.showCancel === false;
        popupConfirm.style.display = 'inline-block';
        popupCancel.style.display = isAlert ? 'none' : 'inline-block';
        customPopup.style.display = 'flex';

        return new Promise((resolve) => {
            const doConfirm = () => { customPopup.style.display = 'none'; cleanup(); resolve(true); };
            const doCancel  = () => { customPopup.style.display = 'none'; cleanup(); resolve(false); };
            const cleanup = () => {
                popupConfirm.removeEventListener('click', doConfirm);
                popupCancel.removeEventListener('click', doCancel);
            };
            popupConfirm.addEventListener('click', doConfirm);
            popupCancel.addEventListener('click', doCancel);
        });
    }


    // =========================================================================
    // --- Language Detection ---
    // =========================================================================

    function detectLanguageFromExtension(fileName) {
        // FIX: guard against files with no dot
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
        const languages = {
            'js': 'javascript', 'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json',
            'ts': 'typescript', 'java': 'java', 'cs': 'csharp', 'cpp': 'cpp', 'go': 'go',
            'php': 'php', 'rb': 'ruby', 'rs': 'rust', 'sql': 'sql', 'swift': 'swift',
            'kt': 'kotlin', 'lua': 'lua', 'pl': 'perl', 'sh': 'shell', 'md': 'markdown',
            'rzn': 'razen', 'ryx': 'razen',
        };
        return languages[ext] || 'plaintext';
    }

    function getLanguageName(languageId) {
        const names = {
            'javascript': 'JavaScript', 'python': 'Python', 'html': 'HTML', 'css': 'CSS',
            'typescript': 'TypeScript', 'java': 'Java', 'csharp': 'C#', 'cpp': 'C++',
            'go': 'Go', 'php': 'PHP', 'ruby': 'Ruby', 'rust': 'Rust', 'sql': 'SQL',
            'swift': 'Swift', 'kotlin': 'Kotlin', 'lua': 'Lua', 'perl': 'Perl',
            'shell': 'Shell', 'markdown': 'Markdown', 'plaintext': 'Plain Text', 'razen': 'Ryx',
        };
        return names[languageId] || languageId;
    }


    // =========================================================================
    // --- Context Menu ---
    // =========================================================================

    function showContextMenu(event, path, type) {
        const menu = document.getElementById('file-context-menu');
        contextMenuTarget = { path, type };

        const pasteItem = document.getElementById('context-menu-paste');
        pasteItem.classList.toggle('disabled', !clipboard || type !== 'folder');

        const previewItem = document.getElementById('context-menu-preview');
        const lp = path.toLowerCase();
        const isPreviewable = lp.endsWith('.html') || lp.endsWith('.md') || lp.endsWith('.mdx');
        previewItem.classList.toggle('disabled', !isPreviewable);

        // FIX: Clamp context menu to viewport so it never goes off-screen
        const menuWidth = 185;
        const menuHeight = 300;
        let x = event.pageX;
        let y = event.pageY;
        if (x + menuWidth > window.innerWidth)  x = window.innerWidth  - menuWidth  - 8;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;

        menu.style.display = 'block';
        menu.style.left = `${x}px`;
        menu.style.top  = `${y}px`;
    }

    function hideContextMenu() {
        document.getElementById('file-context-menu').style.display = 'none';
    }

    async function handleContextMenuAction(action) {
        hideContextMenu();
        if (!contextMenuTarget) return;

        const { path, type } = contextMenuTarget;
        await getProjectRootPath();
        const relativePath = getRelativePath(path);

        switch (action) {
            case 'copy':
                clipboard = { path, type, operation: 'copy' };
                break;

            case 'cut':
                clipboard = { path, type, operation: 'cut' };
                break;

            case 'paste':
                if (clipboard && type === 'folder') {
                    const srcRelativePath = getRelativePath(clipboard.path);
                    const destName = clipboard.path.split('/').pop();
                    const result = clipboard.operation === 'cut'
                        ? await fs.rename(currentProject, srcRelativePath, `${relativePath}/${destName}`)
                        : await fs.copy(currentProject, srcRelativePath, relativePath);

                    if (result.success) {
                        if (clipboard.operation === 'cut') clipboard = null;
                        refreshFileTree();
                    } else {
                        showPopup('Error', `Paste failed: ${result.message}`, { showCancel: false });
                    }
                }
                break;

            case 'rename': {
                const newName = await showInputPopup(`Rename ${type}:`);
                if (newName) {
                    const result = await fs.rename(currentProject, relativePath, newName);
                    if (result.success) {
                        // FIX: Update the tab name if the renamed file is currently open
                        const tab = openTabs.find(t => t.path === path);
                        if (tab) {
                            tab.name = newName;
                            renderTabs();
                        }
                        refreshFileTree();
                    } else {
                        showPopup('Error', `Rename failed: ${result.message}`, { showCancel: false });
                    }
                }
                break;
            }

            case 'copy-path':
                navigator.clipboard.writeText(relativePath)
                    .catch(err => console.error('Failed to copy path:', err));
                break;

            case 'preview': {
                const lp = path.toLowerCase();
                if (lp.endsWith('.html') || lp.endsWith('.md') || lp.endsWith('.mdx')) {
                    runCode(path);
                }
                break;
            }

            case 'download':
                showPopup('Not Implemented', 'Download is not yet available.', { showCancel: false });
                break;

            case 'delete': {
                // FIX: renamed from 'confirm' to avoid shadowing window.confirm
                const confirmed = await showPopup(
                    'Confirm Deletion',
                    `Are you sure you want to delete this ${type}?`,
                    { showCancel: true }
                );
                if (confirmed) {
                    const result = await fs.deletePath(currentProject, relativePath);
                    if (result.success) {
                        // FIX: Close any open tabs for the deleted file OR folder's children
                        const tabsToClose = openTabs.filter(t =>
                            t.path === path || t.path.startsWith(path + '/')
                        );
                        // Close in reverse order to avoid index shifting issues
                        [...tabsToClose].reverse().forEach(t => closeTab(t.path));
                        refreshFileTree();
                    } else {
                        showPopup('Error', `Could not delete: ${result.message}`, { showCancel: false });
                    }
                }
                break;
            }
        }
    }

    // FIX: Changed e.target to e.currentTarget for paste/preview disabled checks
    // (e.target could be the child <i> icon, missing the disabled class on the <li>)
    document.getElementById('context-menu-copy').addEventListener('click',      () => handleContextMenuAction('copy'));
    document.getElementById('context-menu-cut').addEventListener('click',       () => handleContextMenuAction('cut'));
    document.getElementById('context-menu-paste').addEventListener('click',     (e) => { if (!e.currentTarget.classList.contains('disabled')) handleContextMenuAction('paste'); });
    document.getElementById('context-menu-rename').addEventListener('click',    () => handleContextMenuAction('rename'));
    document.getElementById('context-menu-copy-path').addEventListener('click', () => handleContextMenuAction('copy-path'));
    document.getElementById('context-menu-preview').addEventListener('click',   (e) => { if (!e.currentTarget.classList.contains('disabled')) handleContextMenuAction('preview'); });
    document.getElementById('context-menu-download').addEventListener('click',  () => handleContextMenuAction('download'));
    document.getElementById('context-menu-delete').addEventListener('click',    () => handleContextMenuAction('delete'));

    window.addEventListener('click', hideContextMenu);


    // =========================================================================
    // --- Monaco Editor Initialization ---
    // =========================================================================

    require.config({ paths: { vs: 'monaco/package/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        registerRazenLanguage();

        const savedFont = localStorage.getItem('editorFont') || 'Geist Mono';

        editor = monaco.editor.create(document.getElementById('editor'), {
            value: `// Welcome to Ryx Studio\n// Open a file from the sidebar to start editing.`,
            language: 'plaintext',
            theme: document.body.classList.contains('light-theme') ? 'razen-light' : 'razen-dark',
            fontFamily: savedFont,
            automaticLayout: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            wordWrap: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
        });

        // NOTE: Auto-save is now handled per-model in openFile() with a 500ms debounce.
        // The global onDidChangeModelContent is no longer needed for saving.

        editor.onDidChangeCursorPosition(e => {
            cursorPosition.textContent = `Line ${e.position.lineNumber}, Column ${e.position.column}`;
        });

        // Sync font/theme changes from Settings page (opened in same browser)
        window.addEventListener('storage', (e) => {
            if (e.key === 'editorFont' && e.newValue && editor) {
                editor.updateOptions({ fontFamily: e.newValue });
            }
            if (e.key === 'theme' && e.newValue && editor) {
                const isLight = e.newValue === 'light-theme';
                monaco.editor.setTheme(isLight ? 'razen-light' : 'razen-dark');
                document.body.classList.toggle('light-theme', isLight);
                const icon = themeToggle.querySelector('i');
                if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
            }
        });

        loadProjectFromURL();
    });
});
