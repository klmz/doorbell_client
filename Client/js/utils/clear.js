const clear = (el) =>{
    while(el.firstChild){
        el.removeChild(el.firstChild);
    }
}

export default clear;