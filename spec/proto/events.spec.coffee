describe "Events", ->
  it "exposes the no-results row and announces when it is cleared", ->
    div = new Element('div').update("<select multiple><option>Apple</option></select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)
    events = []
    for name in ['chosen:no_results', 'chosen:no_results_clear']
      select.observe name, (event) ->
        events.push [event.eventName, event.memo.search_term, event.memo.no_results.isConnected]
        event.memo.no_results.down('span').update('custom') if event.eventName is 'chosen:no_results'

    chosen.no_results('missing')
    expect(chosen.search_results.down('.no-results span').textContent).toBe('custom')
    chosen.no_results_clear()
    chosen.no_results_clear()

    expect(events).toEqual [
      ['chosen:no_results', 'missing', true]
      ['chosen:no_results_clear', 'missing', true]
    ]
    expect(chosen.search_results.down('.no-results')).toBeUndefined()
    div.remove()

  it "keeps an open dropdown active when a click lands on its container", ->
    div = new Element('div').update("<select><option></option><option>One</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    chosen.results_show()
    chosen.test_active_click(target: chosen.container, which: 1)

    expect(chosen.active_field).toBe(true)
    expect(chosen.results_showing).toBe(true)
    div.remove()

  it "refreshes both select types after a native form reset", (done) ->
    form = new Element('form').update("<select class='single'><option selected>One</option><option>Two</option></select><select class='multiple' multiple><option selected>Alpha</option><option>Beta</option></select>")
    document.body.appendChild(form)
    single = form.down('select.single')
    multiple = form.down('select.multiple')
    new Chosen(single)
    new Chosen(multiple)
    single.value = 'Two'
    single.fire('chosen:updated')
    multiple.options[0].selected = false
    multiple.options[1].selected = true
    multiple.fire('chosen:updated')

    form.reset()
    setTimeout (->
      expect(single.value).toBe('One')
      expect(form.down('.chosen-single span').textContent).toBe('One')
      expect($A(multiple.selectedOptions).pluck('textContent')).toEqual(['Alpha'])
      expect(form.down('.search-choice span').textContent).toBe('Alpha')
      form.remove()
      done()
    ), 10

  it "opens an already activated single or multiple select programmatically", ->
    for multiple in [false, true]
      attribute = if multiple then " multiple" else ""
      div = new Element('div').update("<select#{attribute}><option>One</option><option>Two</option></select>")
      document.body.appendChild(div)
      select = div.down('select')
      chosen = new Chosen(select)

      select.fire('chosen:activate')
      expect(chosen.active_field).toBe true
      select.fire('chosen:open')
      expect(chosen.results_showing).toBe true
      select.fire('chosen:open')
      expect(chosen.results_showing).toBe true
      chosen.destroy()
      div.remove()

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

  it "does not prevent non-cancelable wheel events", ->
    div = new Element('div').update('<select><option>One</option></select>')
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    preventDefault = jasmine.createSpy('preventDefault')

    chosen.search_results_mousewheel
      type: 'mousewheel'
      cancelable: false
      deltaY: 10
      preventDefault: preventDefault

    expect(preventDefault).not.toHaveBeenCalled()

    chosen.destroy()
    div.remove()

  it "prevents cancelable wheel events", ->
    div = new Element('div').update('<select><option>One</option></select>')
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    preventDefault = jasmine.createSpy('preventDefault')

    chosen.search_results_mousewheel
      type: 'mousewheel'
      cancelable: true
      deltaY: 10
      preventDefault: preventDefault

    expect(preventDefault).toHaveBeenCalled()

    chosen.destroy()
    div.remove()

  it "leaves legacy wheel events alone when standard wheel scrolling is available", ->
    return unless 'onwheel' of document
    div = new Element('div').update('<select><option>One</option></select>')
    document.body.appendChild(div)
    chosen = new Chosen(div.down('select'))
    event = document.createEvent('CustomEvent')
    event.initCustomEvent('DOMMouseScroll', true, true, 3)

    chosen.search_results.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    chosen.destroy()
    div.remove()
