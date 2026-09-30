describe "Events", ->
  it "exposes the no-results row and announces when it is cleared", ->
    div = $("<div><select multiple><option>Apple</option></select></div>").appendTo('body')
    select = div.find('select').chosen()
    chosen = select.data('chosen')
    events = []
    select.on 'chosen:no_results chosen:no_results_clear', (event, data) ->
      events.push [event.type, data.search_term, data.no_results[0].isConnected]
      data.no_results.find('span').text('custom') if event.type is 'chosen:no_results'

    chosen.no_results('missing')
    expect(chosen.search_results.find('.no-results span').text()).toBe('custom')
    chosen.no_results_clear()
    chosen.no_results_clear()

    expect(events).toEqual [
      ['chosen:no_results', 'missing', true]
      ['chosen:no_results_clear', 'missing', true]
    ]
    expect(chosen.search_results.find('.no-results').length).toBe(0)
    div.remove()

  it "reports the previous single-select value when switching or clearing", ->
    div = $("<div><select><option value=''></option><option value='one'>One</option><option value='two'>Two</option></select></div>").appendTo('body')
    select = div.find('select').chosen(allow_single_deselect: true)
    chosen = select.data('chosen')
    events = []
    select.on 'input change', (evt, params) -> events.push [evt.type, params]

    choose = (index) ->
      chosen.results_show()
      div.find(".active-result[data-option-array-index='#{index}']").trigger($.Event('mouseup', which: 1))

    choose(1)
    choose(2)
    chosen.results_reset()

    expect(select.val()).toBe('')
    expect(events).toEqual [
      ['input', { selected: 'one' }]
      ['change', { selected: 'one' }]
      ['input', { selected: 'two', deselected: 'one' }]
      ['change', { selected: 'two', deselected: 'one' }]
      ['input', { deselected: 'two' }]
      ['change', { deselected: 'two' }]
    ]
    select.chosen('destroy')
    div.remove()

  it "focuses the native search input without jQuery's focus shorthand", ->
    div = $("<div><select multiple><option>One</option><option>Two</option></select></div>").appendTo('body')
    select = div.find('select').chosen()
    chosen = select.data('chosen')
    chosen.results_show()
    chosen.search_field.focus = undefined
    div.find('.active-result').first().trigger($.Event('mouseup', which: 1))

    expect(select.val()).toEqual(['One'])
    expect(document.activeElement).toBe(chosen.search_field[0])
    div.remove()

  it "refreshes both select types after a native form reset", (done) ->
    form = $("<form><select class='single'><option selected>One</option><option>Two</option></select><select class='multiple' multiple><option selected>Alpha</option><option>Beta</option></select></form>").appendTo('body')
    single = form.find('select.single').chosen()
    multiple = form.find('select.multiple').chosen()
    single.val('Two').trigger('chosen:updated')
    multiple.val(['Beta']).trigger('chosen:updated')

    form[0].reset()
    setTimeout (->
      expect(single.val()).toBe('One')
      expect(form.find('.chosen-single span').text()).toBe('One')
      expect(multiple.val()).toEqual(['Alpha'])
      expect(form.find('.search-choice span').first().text()).toBe('Alpha')
      form.remove()
      done()
    ), 10

  it "restores a required select's original positioning after form reset", (done) ->
    form = $("<form><select required style='left: 7px'><option value=''></option><option value='one' selected>One</option></select></form>").appendTo('body')
    select = form.find('select').chosen()
    select.val('')
    expect(form[0].reportValidity()).toBe(false)
    expect(select[0].style.left).not.toBe('7px')
    form[0].reset()
    setTimeout (->
      expect(select.val()).toBe('one')
      expect(select[0].style.left).toBe('7px')
      expect(select[0].style.position).toBe('absolute')
      form.remove()
      done()
    ), 10

  it "opens an already activated single or multiple select programmatically", ->
    for multiple in [false, true]
      attribute = if multiple then " multiple" else ""
      div = $("<div><select#{attribute}><option>One</option><option>Two</option></select></div>").appendTo('body')
      select = div.find('select').chosen()
      chosen = select.data('chosen')

      select.trigger('chosen:activate')
      expect(chosen.active_field).toBe true
      select.trigger('chosen:open')
      expect(chosen.results_showing).toBe true
      select.trigger('chosen:open')
      expect(chosen.results_showing).toBe true
      select.chosen('destroy')
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
