describe "Events", ->
  it "chosen should fire the right events", ->
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

    event_sequence = []
    document.addEventListener 'input', -> event_sequence.push 'input'
    document.addEventListener 'change', -> event_sequence.push 'change'

    container = div.down(".chosen-container")
    # Directly call the mousedown handler since event simulation doesn't work with Prototype.observe
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)
    expect(container.hasClassName("chosen-container-active")).toBe true

    # select an item
    result = container.select(".active-result").last()
    mockUpEvt = { target: result, which: 1, preventDefault: -> }
    chosen.search_results_mouseup(mockUpEvt)

    expect(event_sequence).toEqual ['input', 'change']
    div.remove()

  it "closes an open dropdown when the browser window loses focus", ->
    div = new Element("div")
    div.update("<select multiple><option>One</option></select><select><option>Two</option></select>")
    document.body.appendChild(div)
    selects = div.select("select")
    first = new Chosen(selects.first())
    second = new Chosen(selects.last())

    selects.first().fire('chosen:open')
    expect(first.results_showing).toBe true

    blur_event = document.createEvent('HTMLEvents')
    blur_event.initEvent('blur', false, false)
    window.dispatchEvent(blur_event)
    selects.last().fire('chosen:open')

    expect(first.results_showing).toBe false
    expect(second.results_showing).toBe true
    expect(div.select('.chosen-with-drop').length).toBe 1

    first.destroy()
    second.destroy()
    div.remove()
