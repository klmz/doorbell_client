const registerComponent = (component) =>{
    window.customElements.define(`app-${component.name.toLowerCase()}`, component);
}
export default registerComponent;
