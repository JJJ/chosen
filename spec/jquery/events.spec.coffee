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
    div = $("<div>").html(tmpl)
    $('body').append(div)
    select = div.find("select")
    expect(select.length).toBe(1)
    select.chosen()
    # very simple check that the necessary elements have been created
    ["container", "container-single", "single", "default"].forEach (clazz)->
      el = div.find(".chosen-#{clazz}")
      expect(el.length).toBe(1)

    # test a few interactions
    event_sequence = []
    div.on 'input change', (evt) -> event_sequence.push evt.type

    container = div.find(".chosen-container")
    container.trigger("mousedown") # open the drop
    expect(container.hasClass("chosen-container-active")).toBe true
    #select an item
    container.find(".active-result").last().trigger $.Event("mouseup", which: 1)

    expect(event_sequence).toEqual ['input', 'change']
    div.remove()

  it "closes an open dropdown when the browser window loses focus", ->
    div = $("<div>").html("<select multiple><option>One</option></select><select><option>Two</option></select>")
    $('body').append(div)
    selects = div.find("select").chosen()
    first = selects.first().data('chosen')
    second = selects.last().data('chosen')

    selects.first().trigger('chosen:open')
    expect(first.results_showing).toBe true

    $(window).triggerHandler('blur')
    selects.last().trigger('chosen:open')

    expect(first.results_showing).toBe false
    expect(second.results_showing).toBe true
    expect(div.find('.chosen-with-drop').length).toBe 1

    selects.chosen('destroy')
    div.remove()

  it "does not prevent non-cancelable wheel events", ->
    div = $("<div><select><option>One</option></select></div>").appendTo('body')
    select = div.find('select').chosen()
    chosen = select.data('chosen')
    preventDefault = jasmine.createSpy('preventDefault')

    chosen.search_results_mousewheel
      type: 'mousewheel'
      cancelable: false
      originalEvent: { deltaY: 10 }
      preventDefault: preventDefault

    expect(preventDefault).not.toHaveBeenCalled()

    select.chosen('destroy')
    div.remove()

  it "prevents cancelable wheel events", ->
    div = $("<div><select><option>One</option></select></div>").appendTo('body')
    select = div.find('select').chosen()
    chosen = select.data('chosen')
    preventDefault = jasmine.createSpy('preventDefault')

    chosen.search_results_mousewheel
      type: 'mousewheel'
      cancelable: true
      originalEvent: { deltaY: 10 }
      preventDefault: preventDefault

    expect(preventDefault).toHaveBeenCalled()

    select.chosen('destroy')
    div.remove()

  it "leaves legacy wheel events alone when standard wheel scrolling is available", ->
    return unless 'onwheel' of document
    div = $("<div><select><option>One</option></select></div>").appendTo('body')
    select = div.find('select').chosen()
    event = document.createEvent('CustomEvent')
    event.initCustomEvent('DOMMouseScroll', true, true, 3)

    div.find('.chosen-results')[0].dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    select.chosen('destroy')
    div.remove()
