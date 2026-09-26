describe "Bugfixes", ->
  it "does not reopen multiple selects after focus has moved", (done) ->
    div = new Element("div").update("<select multiple><option>One</option></select><select multiple><option>Two</option></select><select multiple><option>Three</option></select>")
    document.body.appendChild(div)
    chosens = (new Chosen(select) for select in div.select("select"))
    fields = div.select(".chosen-search-input")

    fields[0].focus()
    fields[0].blur()
    fields[1].focus()
    fields[1].blur()
    fields[2].focus()

    setTimeout ->
      expect(div.select(".chosen-with-drop").length).toBe(1)
      expect(chosens[2].results_showing).toBe(true)
      expect(document.activeElement).toBe(fields[2])
      div.remove()
      done()
    , 160

  it "reopens an active multiple select on a repeated mouse click", ->
    div = new Element("div").update("<select multiple><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    select = div.down("select")
    chosen = new Chosen(select)
    container = div.down(".chosen-container")
    down_event = (target) -> { target: target, which: 1, type: 'mousedown', stop: -> }

    chosen.container_mousedown(down_event(container))
    result = container.select(".active-result").first()
    chosen.search_results_mouseup(target: result, which: 1, preventDefault: ->)
    expect(chosen.results_showing).toBe(false)
    expect(chosen.active_field).toBe(true)

    chosen.container_mousedown(down_event(chosen.search_field))
    expect(chosen.results_showing).toBe(true)
    div.remove()

  it "ignores the compatibility mouse event after a touch selection", ->
    div = new Element("div").update("<select multiple><option>One</option><option>Two</option></select>")
    document.body.appendChild(div)
    chosen = new Chosen(div.down("select"))
    container = div.down(".chosen-container")

    chosen.container_mousedown(target: container, type: 'touchstart', stop: ->)
    result = container.select(".active-result").first()
    chosen.search_results_touchstart(target: result)
    chosen.search_results_touchend(target: result, type: 'touchend', preventDefault: ->)
    expect(chosen.results_showing).toBe(false)

    chosen.container_mousedown(target: container, type: 'mousedown', which: 1, stop: ->)
    expect(chosen.results_showing).toBe(false)
    chosen.container_mousedown()
    expect(chosen.results_showing).toBe(false)
    div.remove()

  it "recovers after clearing a search with no results", ->
    div = new Element("div").update("<select multiple><option value=''></option><option value='one'>One</option><option value='two'>Two</option></select>")
    document.body.appendChild(div)
    select = div.down("select")
    chosen = new Chosen select,
      search_contains: true
      max_selected_options: 1

    chosen.results_show()
    chosen.search_field.value = "missing"
    chosen.results_search()
    expect(div.select(".no-results").length).toBe(1)

    chosen.search_field.value = ""
    chosen.results_search()
    result = div.select(".active-result").first()
    chosen.search_results_mouseup(target: result, which: 1, preventDefault: ->)

    expect(select.options[1].selected).toBe(true)
    expect(div.down(".search-choice span").textContent).toBe("One")
    div.remove()

  it "https://github.com/harvesthq/chosen/issues/2996 - XSS Vulnerability with `include_group_label_in_selected: true`", ->
    tmpl = "
      <select>
        <option value=''></option>
        <optgroup id='xss' label='</script><script>console.log(1)</script>'>
          <option>an xss option</option>
        </optgroup>
      </select>
    "
    div = new Element("div")
    document.body.insert(div)
    div.innerHTML = tmpl

    select = div.down("select")
    chosen = new Chosen select,
      include_group_label_in_selected: true

    # open the drop
    container = div.down(".chosen-container")
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)

    xss_option = container.select(".active-result").last()
    expect(xss_option.innerHTML).toBe "an xss option"

    # trigger the selection of the xss option
    mockUpEvt = { target: xss_option, which: 1, preventDefault: -> }
    chosen.search_results_mouseup(mockUpEvt)

    # make sure the script tags are escaped correctly
    label_html = container.down("a.chosen-single").innerHTML
    expect(label_html).toContain('&lt;/script&gt;&lt;script&gt;console.log(1)&lt;/script&gt;')
