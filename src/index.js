/* eslint-disable no-undef */
import 'reset.css';
import './style.css';
import KEYS from './keys';

function createLayout() {
  const container = document.createElement('div');
  container.classList.add('container');
  document.body.appendChild(container);
  const heading = document.createElement('h1');
  heading.innerHTML = 'Virtual Keyboard';
  container.appendChild(heading);
  const paragraph = document.createElement('p');
  paragraph.innerHTML = 'Сделано на OC Windows. Чтобы переключить язык, нажмите LeftCtrl + LeftAlt.';
  container.appendChild(paragraph);
  const textarea = document.createElement('textarea');
  textarea.classList.add('text');
  document.body.appendChild(textarea);
  const keyboardContainer = document.createElement('div');
  keyboardContainer.classList.add('keyboard__container');
  document.body.appendChild(keyboardContainer);
}

class Keyboard {
  constructor(keyboardContainer, keys) {
    this.lang = this.getLanguage();
    this.keys = keys;
    this.keyboardContainer = keyboardContainer;
    this.isCapsLock = false;
    this.pressedBtns = [];
    this.createKeyboard();
  }

  createKeyboard() {
    let currentRow;
    this.keys.forEach((key) => {
      if (currentRow !== key.row) {
        const row = document.createElement('div');
        row.classList.add('keyboard__row');
        this.keyboardContainer.appendChild(row);
        currentRow = key.row;
      }
      const button = document.createElement('button');
      button.dataset.keyCode = key.code;
      button.classList.add('keyboard__key');
      if (key.classes) {
        button.classList = key.classes;
      }
      button.innerHTML = key.isSpecial ? key.name : key[this.lang];

      this.keyboardContainer.querySelectorAll('.keyboard__row')[currentRow].appendChild(button);
    });
  }

  isPressed(keyName) {
    if (keyName === 'CapsLock') {
      return this.isCapsLock;
    }
    return this.pressedBtns.some((key) => key.includes(keyName));
  }

  changeState(code, type) {
    this.press(code, type);
    this.activateKeys();
    this.switchLanguage();
    this.updateKeys();
  }

  updateKeys() {
    this.keyboardContainer.querySelectorAll('button')
      .forEach((button) => {
        const data = this.getButtonInfo(button);
        if (!data.isSpecial) {
          let updated = data[this.lang];

          if (this.isPressed('Shift') || (this.isPressed('Shift') && this.isPressed('CapsLock'))) {
            updated = data[`${this.lang}Up`];
          } else if (this.isPressed('CapsLock')) {
            updated = data[this.lang].toUpperCase();
          }

          document.querySelector(`[data-key-code="${data.code}"]`).innerHTML = updated;
        }
      });
  }

  setLanguage(lang = this.lang) {
    localStorage.setItem('lang', lang);
    return this;
  }

  getLanguage() {
    if (localStorage.getItem('lang')) {
      this.lang = localStorage.getItem('lang');
    } else {
      this.lang = 'en';
    }
    return this.lang;
  }

  switchLanguage() {
    if (this.isPressed('AltLeft') && this.isPressed('ControlLeft')) {
      this.lang = (this.lang === 'en') ? 'ru' : 'en';
      this.setLanguage(this.lang);
    }
  }

  getButtonInfo(button) {
    return this.keys.filter((key) => key.code === button.dataset.keyCode)[0];
  }

  press(code, event) {
    if (code === 'CapsLock') {
      switch (event) {
        case 'mousedown':
        case 'keyup':
          this.isCapsLock = !this.isCapsLock;
          break;
        default:
          break;
      }
    } else if (code !== 'CapsLock') {
      switch (event) {
        case 'keydown':
        case 'mousedown':
          if (!this.isPressed(code)) this.pressedBtns.push(code);
          break;
        case 'keyup':
          if (this.isPressed(code)) this.pressedBtns.splice(this.pressedBtns.indexOf(code), 1);
          break;
        case 'click':
          if (this.isPressed(code)) {
            this.pressedBtns.splice(this.pressedBtns.indexOf(code), 1);
          }
          break;
        default:
          break;
      }
    }
  }

  type(button, text) {
    const data = this.getButtonInfo(button);
    let updated = text;
    if (data.isSpecial === true) {
      switch (data.code) {
        case 'Backspace':
          updated = updated.slice(0, -1);
          break;
        case 'Tab':
          updated = `${updated}\t`;
          break;
        case 'Enter':
          updated = `${updated}\n`;
          break;
        case 'Space':
          updated = `${updated} `;
          break;
        default:
          updated = text;
      }
    } else if (this.isPressed('Shift')) {
      updated += data[`${this.lang}Up`];
    } else if (this.isPressed('CapsLock')) {
      updated += data[this.lang].toUpperCase();
    } else {
      updated += data[this.lang];
    }
    return updated;
  }

  activateKeys() {
    this.keyboardContainer.querySelectorAll('button').forEach((button) => {
      if (!this.isPressed(button.dataset.keyCode)) {
        button.classList.remove('active');
      }
    });
    this.pressedBtns.forEach((key) => this.keyboardContainer.querySelector(`[data-key-code="${key}"]`).classList.add('active'));
    if (this.isCapsLock) {
      this.keyboardContainer.querySelector('[data-key-code="CapsLock"]').classList.add('active');
    }
  }
}

function handleKeyboard() {
  const keyboardContainer = document.querySelector('.keyboard__container');
  const textarea = document.querySelector('textarea');
  const keyboard = new Keyboard(keyboardContainer, KEYS);

  const pressMouseButton = (e) => {
    if (e.target.tagName === 'BUTTON') {
      keyboard.changeState(e.target.dataset.keyCode, e.type);
      textarea.value = keyboard.type(e.target, textarea.value);
    }
  };

  const releaseMouseButton = (e) => {
    const code = e.target.dataset.keyCode ? e.target.dataset.keyCode : '';
    keyboard.changeState(code, e.type);
  };

  keyboardContainer.addEventListener('mousedown', pressMouseButton);
  document.addEventListener('click', releaseMouseButton);

  const pressComputerKey = (e) => {
    e.preventDefault();
    const virtualKey = keyboard.keyboardContainer.querySelector(`[data-key-code="${e.code}"]`);
    if (virtualKey) {
      keyboard.changeState(e.code, e.type);
      if (e.type === 'keydown') {
        textarea.value = keyboard.type(virtualKey, textarea.value);
      }
    }
  };

  document.addEventListener('keydown', pressComputerKey);
  document.addEventListener('keyup', pressComputerKey);
  textarea.focus();
  textarea.addEventListener('blur', () => textarea.focus());
}

createLayout();
handleKeyboard();
