import registerComponent from './registerComponent.js'

class Button extends HTMLElement{
    get id() {
        return this.getAttribute('id');
      }
    
    set id(val) {
        // Reflect the value of the open property as an HTML attribute.
        if (val) {
            this.setAttribute('id', '');
        } else {
            this.removeAttribute('id');
        }
    }

    connectedCallback(){
        this.button = document.createElement('button');
        this.button.setAttribute('class', 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent');
        componentHandler.upgradeElement(this.button);
        this.button.innerHTML = this.getAttribute('data-text');
        this.appendChild(this.button);
    }
}

registerComponent(Button);