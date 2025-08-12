// ----------------------------------------------------------------
// CONFIGS & CONSTANTS
export const DEFAULT_TAB_TITLE = "Untitle Tab Note";
export const DEFAULT_FAVICON = "assets/bluefolder.png";
export const THEMES = {
    DARK: "dark",
    LIGHT: "light"
};
export const SHORTCUTS = {
    SAVE: { key: 's', modifiers: ['alt'] },
    NEW_NOTE: { key: 'n', modifiers: ['alt'] },
    ESCAPE: { key: 'Escape' }
}
export const DEFAULT_THEME = THEMES.DARK;
// ELEMENT REFS
const tabNoteTitle = document.getElementById('tabNoteTitle');
const tabNoteIcon = document.getElementById('tabNoteIcon');
const tabNoteNotes = document.getElementById('tabNoteNotes');
const favicon = document.getElementById('favicon');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const noteId = document.getElementById('noteId');
const wordCount = document.getElementById('wordCount');
const saveBtn = document.getElementById('saveBtn');
// ----------------------------------------------------------------

// CONFIG HANDLER METHODS
function setConfigs() {
    setDefaultTabTitle();
    setDefaultFavicon();
    setDefaultTheme();
}

function setDefaultTabTitle() {
    document.title = DEFAULT_TAB_TITLE;
}

function setDefaultFavicon() {
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
        favicon.href = DEFAULT_FAVICON;
    }
}

function setDefaultTheme() {
    const currentTheme = localStorage.getItem("tabnotes-theme") || DEFAULT_THEME;
    document.body.classList.add(currentTheme);
}

setConfigs();

// UTILITY FUNCTIONS
function slugify(text) {
    return text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

function getNoteKey() {
    let key = location.hash.slice(1);
    if (!key) key = "default";
    return `tabnotes-data-${key}`;
}

function updateNoteId() {
    const key = location.hash.slice(1) || "default";
    noteId.textContent = key;
}

// STATUS HANDLING
let isDirty = false;
function setStatus(saved) {
    statusText.textContent = saved ? 'Saved' : 'Unsaved';
    statusIndicator.classList.toggle('unsaved', !saved);
}
function markUnsaved() {
    if (!isDirty) {
        isDirty = true;
        setStatus(false);
    }
}
[tabNoteTitle, tabNoteIcon, tabNoteNotes].forEach(el => {
    el.addEventListener('input', markUnsaved);
});

function loadNote(key) {
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return false;

        const data = JSON.parse(saved);
        tabNoteTitle.value = data.title || "";
        tabNoteIcon.value = data.icon || "";
        tabNoteNotes.value = data.content || "";
        updatePage(data.title, data.icon);
        updateWordCount();

        isDirty = false;
        setStatus(true);
        return true;
    } catch {
        return false;
    }
}

function saveNote(key) {
    const data = {
        title: tabNoteTitle.value.trim(),
        icon: tabNoteIcon.value.trim(),
        content: tabNoteNotes.value,
    };

    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("fatal: failed to save note:", e);
    }

    updatePage(data.title, data.icon);
    isDirty = false;
    setStatus(true);
}

function updatePage(title, icon) {
    document.title = title || DEFAULT_TAB_TITLE;
    favicon.href = icon || DEFAULT_FAVICON;
}

function updateWordCount() {
    const words = tabNoteNotes.value.trim().split(/\s+/).filter(word => word.length > 0).length;
    wordCount.textContent = `${words} words`;
}

// APP INITIALIZATION
let currentKey = getNoteKey();
updateNoteId();

if (!loadNote(currentKey)) {
    setDefaultTabTitle();
    updateWordCount();
    setStatus(true);
}

// THEME HANDLER
const darkBtn = document.getElementById('darkBtn');
const lightBtn = document.getElementById('lightBtn');

function setTheme(theme) {
    if (theme === THEMES.LIGHT) {
        document.body.classList.add('light-theme');
        darkBtn.classList.remove('active');
        lightBtn.classList.add('active');
    } else {
        document.body.classList.remove('light-theme');
        lightBtn.classList.remove('active');
        darkBtn.classList.add('active');
    }
    localStorage.setItem('tabnotes-theme', theme);
}

darkBtn.addEventListener('click', () => setTheme(THEMES.DARK));
lightBtn.addEventListener('click', () => setTheme(THEMES.LIGHT));

const savedTheme = localStorage.getItem('tabnotes-theme');
setTheme(savedTheme || DEFAULT_THEME);

// SAVE BUTTON HANDLING
saveBtn.addEventListener('click', () => {
    const newSlug = slugify(tabNoteTitle.value.trim()) || "default";
    if (newSlug !== currentKey.slice("tabnotes-data-".length)) {
        currentKey = `tabnotes-data-${newSlug}`;
        history.replaceState(null, "", "#" + newSlug);
        updateNoteId();
    }
    saveNote(currentKey);
});

// KEYBOARD SHORTCUT
document.addEventListener('keydown', function (e) {
    function checkModifiers(requiredModifiers) {
        const mods = {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            meta: e.metaKey,
            shift: e.shiftKey
        };
        if (!requiredModifiers) return true;
        return requiredModifiers.every(mod => mods[mod]);
    }

    function matchShortcut(shortcut) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const modifiersMatch = checkModifiers(shortcut.modifiers);
        return keyMatch && modifiersMatch;
    }

    if (matchShortcut(SHORTCUTS.SAVE)) {
        e.preventDefault();
        saveBtn.click();
    } else if (matchShortcut(SHORTCUTS.NEW_NOTE)) {
        e.preventDefault();
        location.hash = 'new-note-' + Date.now();
        location.reload();
    } else if (e.key === SHORTCUTS.ESCAPE.key) {
        document.activeElement.blur();
    }
});

// WORK COUNT HANDLING
tabNoteNotes.addEventListener('input', updateWordCount);

// AUTO RESIZE TEXTAREA
tabNoteNotes.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.max(400, this.scrollHeight) + 'px';
});

// HANDLE HASH CHANGE
window.addEventListener('hashchange', () => {
    currentKey = getNoteKey();
    updateNoteId();
    if (!loadNote(currentKey)) {
        tabNoteTitle.value = '';
        tabNoteIcon.value = '';
        tabNoteNotes.value = '';
        setDefaultTabTitle();
        updateWordCount();
        isDirty = false;
        setStatus(true);
    }
});

// EFFECTS
const formSections = document.querySelectorAll('.form-section');
formSections.forEach(section => {
    section.addEventListener('mouseenter', function () {
        this.style.borderColor = 'var(--border-secondary)';
    });
    section.addEventListener('mouseleave', function () {
        this.style.borderColor = 'var(--border-primary)';
    });
});