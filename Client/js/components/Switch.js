import registerComponent from './registerComponent.js'

class Switch extends HTMLElement{
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

    get checked(){
        return this.input.checked;
    }

    set checked(val){
        this.input.checked = val;
        if(this.input.checked){
            this.label.classList.add('is-checked')    
        }else{
            this.label.classList.remove('is-checked')
        }
        
    }

    connectedCallback(){
        this.label = document.createElement('label');
        this.label.setAttribute('for', `_${this.id}`);
        this.label.setAttribute('class', 'mdl-switch mdl-js-switch mdl-js-ripple-effect');

        this.input = document.createElement('input')
        this.input.setAttribute('type', 'checkbox');
        this.input.setAttribute('id', `_${this.id}`);
        this.input.setAttribute('class', 'mdl-switch__input');
        this.input.setAttribute('checked', this.checked);
        
        const span = document.createElement('span');
        span.setAttribute('class', 'mdl-switch__label')
        span.innerHTML = this.getAttribute('data-text');
        this.label.append(this.input);
        this.label.append(span);
        componentHandler.upgradeElement(this.label);
        this.appendChild(this.label);
    }
};

registerComponent(Switch);