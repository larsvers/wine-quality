function frequency() {
  let variable;
  function layout(data) {
    debugger;
  }

  layout.variable = _ => (_ ? ((variable = _), layout) : variable);

  return layout;
}

export default frequency;
