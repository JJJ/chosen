describe 'search', ->
  it 'should display only matching items when entering a search term', ->
    tmpl = '''
      <select data-placeholder="Choose a Country...">
        <option value=""></option>
        <option value="United States">United States</option>
        <option value="United Kingdom">United Kingdom</option>
        <option value="Afghanistan">Afghanistan</option>
      </select>
    '''
    div = new Element('div')
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select)

    container = div.down('.chosen-container')
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)
    # Expect all results to be shown
    results = div.select('.active-result')
    expect(results.length).toBe(3)

    # Enter some text in the search field.
    search_field = div.down(".chosen-search input")
    search_field.value = "Afgh"
    mockKeyEvt = { which: 1 }
    chosen.keyup_checker(mockKeyEvt)

    # Expect to only have one result: 'Afghanistan'.
    results = div.select('.active-result')
    expect(results.length).toBe(1)
    expect(results[0].innerText).toBe 'Afghanistan'
    div.remove()

  it 'should only show max_shown_results items in results', ->
    tmpl = '''
      <select data-placeholder="Choose a Country...">
        <option value=""></option>
        <option value="United States">United States</option>
        <option value="United Kingdom">United Kingdom</option>
        <option value="Afghanistan">Afghanistan</option>
      </select>
    '''
    div = new Element('div')
    div.update(tmpl)
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select, { max_shown_results: 1 })

    container = div.down('.chosen-container')
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)
    results = div.select('.active-result')
    expect(results.length).toBe(1)

    # Enter some text in the search field.
    search_field = div.down(".chosen-search input")
    search_field.value = "United"
    mockKeyEvt = { which: 1 }
    chosen.keyup_checker(mockKeyEvt)

    # Showing only one result: the one that occurs first.
    results = div.select('.active-result')
    expect(results.length).toBe(1)
    div.remove()
    expect(results[0].innerText).toBe 'United States'

    # Showing still only one result, but not the first one.
    search_field.value = 'United Ki'
    simulant.fire(search_field, 'keyup')
    results = div.select('.active-result')
    expect(results.length).toBe(1)
    expect(results[0].innerText).toBe 'United Kingdom'
