describe "Bugfixes", ->
  it "does not activate a closed control on a secondary mouse button", ->
    div = $("<div><select><option>One</option><option>Two</option></select><select multiple><option>One</option><option>Two</option></select></div>").appendTo("body")
    div.find("select").chosen()

    for select in div.find("select")
      chosen = $(select).data("chosen")
      for button in [2, 3]
        chosen.container.trigger($.Event("mousedown", which: button))
        expect(chosen.results_showing).toBe(false)
        expect(chosen.active_field).toBe(false)

    div.remove()

  it "focuses a closed multiple select without opening it when open_on_label_click is false", ->
    div = $("<div><label for='label-focus-jquery'>Choices</label><select id='label-focus-jquery' multiple><option>One</option><option>Two</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen(open_on_label_click: false).data("chosen")

    div.find("label").trigger("click")

    expect(chosen.active_field).toBe(true)
    expect(chosen.results_showing).toBe(false)
    expect(document.activeElement).toBe(chosen.search_field[0])
    div.remove()

  it "opens a closed single select when open_on_label_click is true", ->
    div = $("<div><label for='label-open-jquery'>Choices</label><select id='label-open-jquery'><option>One</option><option>Two</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen(open_on_label_click: true).data("chosen")

    div.find("label").trigger("click")

    expect(chosen.active_field).toBe(true)
    expect(chosen.results_showing).toBe(true)
    div.remove()

  it "preserves the default multiple-label opening behavior", ->
    div = $("<div><label for='label-default-jquery'>Choices</label><select id='label-default-jquery' multiple><option>One</option><option>Two</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")

    div.find("label").trigger("click")

    expect(chosen.results_showing).toBe(true)
    div.remove()

  it "keeps an open select visible while its associated label is pressed", (done) ->
    div = $("<div><label for='label-press-jquery'>Choices</label><select id='label-press-jquery'><option>One</option><option>Two</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")
    chosen.container_mousedown()

    div.find("label").trigger("mousedown")
    chosen.search_field.trigger("blur")

    setTimeout ->
      expect(chosen.results_showing).withContext("before the label click").toBe(true)
      div.find("label").trigger("mouseup").trigger("click")
      setTimeout ->
        expect(chosen.results_showing).withContext("after the label click").toBe(true)
        div.remove()
        done()
      , 0
    , 120

  it "keeps an open select visible while its wrapping label is pressed", (done) ->
    div = $("<div><label>Choices<select><option>One</option><option>Two</option></select></label></div>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")
    chosen.container_mousedown()

    div.find("label").trigger("mousedown")
    chosen.search_field.trigger("blur")

    setTimeout ->
      expect(chosen.results_showing).toBe(true)
      div.remove()
      done()
    , 120

  it "closes promptly when keyboard focus leaves the search field", (done) ->
    div = $("<div><select><option>One</option><option>Two</option></select><button>Next</button></div>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")
    chosen.container_mousedown()
    chosen.search_field.trigger("blur")

    setTimeout ->
      expect(chosen.results_showing).toBe(false)
      div.remove()
      done()
    , 30

  it "does not reopen multiple selects after focus has moved", (done) ->
    div = $("<div><select multiple><option>One</option></select><select multiple><option>Two</option></select><select multiple><option>Three</option></select></div>").appendTo("body")
    selects = div.find("select").chosen()
    fields = div.find(".chosen-search-input")

    fields.eq(0).trigger("focus").trigger("blur")
    fields.eq(1).trigger("focus").trigger("blur")
    fields.eq(2).trigger("focus")

    setTimeout ->
      expect(div.find(".chosen-with-drop").length).toBe(1)
      expect(selects.eq(2).data("chosen").results_showing).toBe(true)
      expect(document.activeElement).toBe(fields[2])
      div.remove()
      done()
    , 160

  it "reopens an active multiple select on a repeated mouse click", ->
    div = $("<div><select multiple><option>One</option><option>Two</option></select></div>").appendTo("body")
    select = div.find("select").chosen()
    chosen = select.data("chosen")
    container = div.find(".chosen-container")

    container.trigger($.Event("mousedown", which: 1))
    container.find(".active-result").first().trigger($.Event("mouseup", which: 1))
    expect(chosen.results_showing).toBe(false)
    expect(chosen.active_field).toBe(true)

    container.find(".chosen-search-input").trigger($.Event("mousedown", which: 1))
    expect(chosen.results_showing).toBe(true)
    div.remove()

  it "ignores the compatibility mouse event after a touch selection", ->
    div = $("<div><select multiple><option>One</option><option>Two</option></select></div>").appendTo("body")
    chosen = div.find("select").chosen().data("chosen")
    container = div.find(".chosen-container")

    container.trigger("touchstart")
    result = container.find(".active-result").first()
    result.trigger("touchstart")
    result.trigger($.Event("touchend"))
    expect(chosen.results_showing).toBe(false)

    container.trigger($.Event("mousedown", which: 1))
    expect(chosen.results_showing).toBe(false)
    chosen.container_mousedown()
    expect(chosen.results_showing).toBe(false)
    div.remove()

  it "recovers after clearing a search with no results", ->
    div = $("<div><select multiple><option value=''></option><option value='one'>One</option><option value='two'>Two</option></select></div>").appendTo("body")
    select = div.find("select").chosen
      search_contains: true
      max_selected_options: 1
    chosen = select.data("chosen")

    chosen.results_show()
    chosen.search_field.val("missing")
    chosen.results_search()
    expect(div.find(".no-results").length).toBe(1)

    chosen.search_field.val("")
    chosen.results_search()
    div.find(".active-result").first().trigger($.Event("mouseup", which: 1))

    expect(select[0].options[1].selected).toBe(true)
    expect(div.find(".search-choice > span").first().text()).toBe("One")
    div.remove()

  it "renders native option text and configurable result labels as text", ->
    div = $("<div><select multiple data-no_results_text='&lt;strong class=&quot;injected&quot;&gt;No match&lt;/strong&gt;' data-create_option_text='&lt;strong class=&quot;injected&quot;&gt;Add&lt;/strong&gt;'></select></div>").appendTo("body")
    option = document.createElement('option')
    option.value = 'safe'
    option.innerHTML = '<strong class="injected">Safe</strong>'
    option.selected = true
    div.find('select')[0].appendChild(option)
    chosen = div.find('select').chosen(create_option: true).data('chosen')

    expect(div.find('.chosen-container .injected').length).toBe(0)
    expect(div.find('.search-choice > span').text()).toBe('Safe')
    chosen.no_results('missing')
    chosen.show_create_option('missing')
    expect(div.find('.chosen-container .injected').length).toBe(0)
    expect(div.find('.no-results').text()).toContain('<strong class="injected">No match</strong>')
    expect(div.find('.create-option').text()).toContain('<strong class="injected">Add</strong>')
    div.remove()

  it "https://github.com/harvesthq/chosen/issues/2996 - XSS Vulnerability with `include_group_label_in_selected: true`", ->
    tmpl = "
      <select>
        <option value=''></option>
        <optgroup label='</script><script>console.log(1)</script>'>
          <option>an xss option</option>
        </optgroup>
      </select>
    "

    div = $("<div>").html(tmpl)
    select = div.find("select")

    select.chosen
      include_group_label_in_selected: true

    # open the drop
    container = div.find(".chosen-container")
    container.trigger("mousedown")

    xss_option = container.find(".active-result").last()
    expect(xss_option.html()).toBe "an xss option"

    # trigger the selection of the xss option
    xss_option.trigger("mouseup")

    # make sure the script tags are escaped correctly
    label_html = container.find("li.group-result").html()
    expect(label_html).toContain('&lt;/script&gt;&lt;script&gt;console.log(1)&lt;/script&gt;')
