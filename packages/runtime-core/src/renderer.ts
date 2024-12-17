export function createRenderer(option) {
    function render() {
        console.log('render', option)
    }
    return {
        render
    }
}