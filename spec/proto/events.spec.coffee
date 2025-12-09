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
