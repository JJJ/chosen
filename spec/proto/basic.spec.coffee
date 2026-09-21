describe "Basic setup", ->
  it "uses the single select as the accessible dropdown control", ->
    div = new Element("div")
    div.update("<select><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down("select"))
    control = div.down(".chosen-single")
    expect(control.readAttribute("role")).toBe("button")
    expect(control.readAttribute("tabindex")).toBe("0")
    expect(control.down("button")).toBeUndefined()
    expect(control.readAttribute("aria-expanded")).toBe("false")
    chosen.results_show()
    expect(control.readAttribute("aria-expanded")).toBe("true")
    chosen.results_hide()
    expect(control.readAttribute("aria-expanded")).toBe("false")
    div.remove()

  it "copies accessible names and descriptions to the search input", ->
    div = new Element("div")
    div.update("<select aria-label='Choices' aria-labelledby='field-label' aria-describedby='field-help'><option>One</option></select>")
    document.body.appendChild(div)
    new Chosen(div.down("select"))
    search = div.down(".chosen-search-input")
    expect(search.readAttribute("aria-label")).toBe("Choices")
    expect(search.readAttribute("aria-labelledby")).toBe("field-label")
    expect(search.readAttribute("aria-describedby")).toBe("field-help")
    div.remove()

  it "should add expose a Chosen global", ->
    expect(Chosen).toBeDefined()

  it "should create very basic chosen", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
        <option value='United Kingdom'>United Kingdom</option>
        <option value='Afghanistan'>Afghanistan</option>
      </select>
    "

    div = new Element("div")
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down("select")
    expect(select).toBeDefined()
    chosen = new Chosen(select)
    # very simple check that the necessary elements have been created
    ["container", "container-single", "single", "default"].forEach (clazz)->
      el = div.down(".chosen-#{clazz}")
      expect(el).toBeDefined()

    # test a few interactions
    expect($F(select)).toBe ""

    container = div.down(".chosen-container")
    # Create a mock event for the mousedown handler
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    # Directly call the mousedown handler since event simulation doesn't work with Prototype.observe
    chosen.container_mousedown(mockEvt)
    expect(container.hasClassName("chosen-container-active")).toBe true

    # select an item by calling the chosen handler directly
    result = container.select(".active-result").last()
    # Create a mock event object with the necessary properties
    mockUpEvt = { target: result, which: 1, preventDefault: -> }
    chosen.search_results_mouseup(mockUpEvt)

    expect($F(select)).toBe "Afghanistan"
    div.remove()

  describe "data-placeholder", ->

    it "should render", ->
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose a Country...")
      div.remove()

    it "should render with special characters", ->
      tmpl = "
        <select data-placeholder='&lt;None&gt;'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("<None>")
      div.remove()

    it "should render with ampersand", ->
      tmpl = "
        <select data-placeholder='Choose from A &amp; B'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose from A & B")
      div.remove()

    it "should handle ampersand in options", ->
      tmpl = "
        <select>
          <option value=''></option>
          <option value='1'>Option 1</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select, {
        placeholder_text_single: 'Choose from A & B'
      })

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose from A & B")
      div.remove()

    it "should handle already-escaped entities in options", ->
      tmpl = "
        <select>
          <option value=''></option>
          <option value='1'>Option 1</option>
        </select>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select, {
        placeholder_text_single: 'Choose from A &amp; B'
      })

      placeholder = div.down(".chosen-single > span")
      expect(placeholder.innerText).toBe("Choose from A & B")
      div.remove()

  describe "disabled fieldset", ->

    it "should render as disabled", ->
      tmpl = "
        <fieldset disabled>
          <select data-placeholder='Choose a Country...'>
            <option value=''></option>
            <option value='United States'>United States</option>
            <option value='United Kingdom'>United Kingdom</option>
            <option value='Afghanistan'>Afghanistan</option>
          </select>
        </fieldset>
      "
      div = new Element("div")
      div.update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      expect(select).toBeDefined()
      new Chosen(select)

      container = div.down(".chosen-container")
      expect(container.hasClassName("chosen-disabled")).toBe true
      expect(container.down(".chosen-single").readAttribute("aria-disabled")).toBe("true")
      expect(container.down(".chosen-single").readAttribute("tabindex")).toBe("-1")
      div.remove()

  it "it should not render hidden options", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value='' hidden>Choose a Country</option>
        <option value='United States'>United States</option>
      </select>
    "
    div = new Element("div")
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down("select")
    expect(select).toBeDefined()
    new Chosen(select)
    container = div.down(".chosen-container")
    simulant.fire(container, "mousedown") # open the drop
    expect(container.select(".active-result").length).toBe 1
    div.remove()

  it "it should not render hidden optgroups", ->
    tmpl = "
      <select>
        <optgroup label='Not shown' hidden>
          <option value='Item1'>Item1</option>
        </optgroup>
        <optgroup label='Shown'>
          <option value='Item2'>Item2</option>
        </optgroup>
      </select>
    "
    div = new Element("div")
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down("select")
    expect(select).toBeDefined()
    new Chosen(select)
    container = div.down(".chosen-container")
    simulant.fire(container, "mousedown") # open the drop
    expect(container.select(".group-result").length).toBe 1
    expect(container.select(".active-result").length).toBe 1
    div.remove()
