describe "Searching", ->
  it "should not match the actual text of HTML entities", ->
    tmpl = "
      <select data-placeholder='Choose an HTML Entity...'>
        <option value=''></option>
        <option value='This & That'>This &amp; That</option>
        <option value='This < That'>This &lt; That</option>
      </select>
    "

    div = new Element('div')
    document.body.insert(div)
    div.update(tmpl)
    select = div.down('select')
    chosen = new Chosen(select, {search_contains: true})

    container = div.down('.chosen-container')
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)

    # Both options should be active
    results = div.select('.active-result')
    expect(results.length).toBe(2)

    # Search for the html entity by name
    search_field = div.down(".chosen-search input")
    search_field.value = "mp"
    mockKeyEvt = { which: 1 }
    chosen.keyup_checker(mockKeyEvt)

    results = div.select(".active-result")
    expect(results.length).toBe(0)

  it "renders options correctly when they contain characters that require HTML encoding", ->
    div = new Element("div")
    div.update("""
      <select>
        <option value="A &amp; B">A &amp; B</option>
      </select>
    """)

    new Chosen(div.down("select"))
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"))
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".active-result").length).toBe(1)
    expect(div.down(".active-result").innerHTML).toBe("A &amp; B")

    search_field = div.down(".chosen-search-input")
    search_field.value = "A"
    mockKeyEvt = { which: 1 }
    chosen_inst.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(1)
    expect(div.down(".active-result").innerHTML).toBe("<em>A</em> &amp; B")

  it "renders optgroups correctly when they contain characters that require HTML encoding", ->
    div = new Element("div")
    div.update("""
      <select>
        <optgroup label="A &lt;b&gt;hi&lt;/b&gt; B">
          <option value="Item">Item</option>
        </optgroup>
      </select>
    """)

    new Chosen(div.down("select"))
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"))
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".group-result").length).toBe(1)
    expect(div.down(".group-result").innerHTML).toBe("A &lt;b&gt;hi&lt;/b&gt; B")

  it "renders optgroups correctly when they contain characters that require HTML encoding when searching", ->
    div = new Element("div")
    div.update("""
      <select>
        <optgroup label="A &amp; B">
          <option value="Item">Item</option>
        </optgroup>
      </select>
    """)

    new Chosen(div.down("select"))
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"))
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".group-result").length).toBe(1)
    expect(div.down(".group-result").innerHTML).toBe("A &amp; B")

    search_field = div.down(".chosen-search-input")
    search_field.value = "A"
    mockKeyEvt = { which: 1 }
    chosen_inst.keyup_checker(mockKeyEvt)

    expect(div.select(".group-result").length).toBe(1)
    expect(div.down(".group-result").innerHTML).toBe("<em>A</em> &amp; B")

  it "renders no results message correctly when it contains characters that require HTML encoding", ->
    div = new Element("div")
    div.update("""
      <select>
        <option value="Item">Item</option>
      </select>
    """)

    new Chosen(div.down("select"))
    simulant.fire(div.down(".chosen-container"), "mousedown") # open the drop

    search_field = div.down(".chosen-search-input")
    search_field.value = "&"
    simulant.fire(search_field, "keyup")

    expect(div.select(".no-results").length).toBe(1)
    expect(div.down(".no-results").innerHTML.trim()).toBe("No results for: <span>&amp;</span>")

    search_field.value = "&amp;"
    simulant.fire(search_field, "keyup")

    expect(div.select(".no-results").length).toBe(1)
    expect(div.down(".no-results").innerHTML.trim()).toBe("No results for: <span>&amp;amp;</span>")

  it "matches in non-ascii languages like Chinese when selecting a single item", ->
    div = new Element("div")
    div.update("""
      <select>
        <option value="一">一</option>
        <option value="二">二</option>
        <option value="三">三</option>
        <option value="四">四</option>
        <option value="五">五</option>
        <option value="六">六</option>
        <option value="七">七</option>
        <option value="八">八</option>
        <option value="九">九</option>
        <option value="十">十</option>
        <option value="十一">十一</option>
        <option value="十二">十二</option>
      </select>
    """)

    new Chosen(div.down("select"))
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"))
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".active-result").length).toBe(12)

    search_field = div.down(".chosen-search-input")
    search_field.value = "一"
    mockKeyEvt = { which: 1 }
    chosen_inst.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(1)
    expect(div.select(".active-result")[0].innerHTML).toBe("<em>一</em>")

  it "matches in non-ascii languages like Chinese when selecting a single item with search_contains", ->
    div = new Element("div")
    div.update("""
      <select>
        <option value="一">一</option>
        <option value="二">二</option>
        <option value="三">三</option>
        <option value="四">四</option>
        <option value="五">五</option>
        <option value="六">六</option>
        <option value="七">七</option>
        <option value="八">八</option>
        <option value="九">九</option>
        <option value="十">十</option>
        <option value="十一">十一</option>
        <option value="十二">十二</option>
      </select>
    """)

    new Chosen(div.down("select"), {search_contains: true})
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"), {search_contains: true})
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".active-result").length).toBe(12)

    search_field = div.down(".chosen-search-input")
    search_field.value = "一"
    mockKeyEvt = { which: 1 }
    chosen_inst.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(2)
    expect(div.select(".active-result")[0].innerHTML).toBe("<em>一</em>")
    expect(div.select(".active-result")[1].innerHTML).toBe("十<em>一</em>")

  it "matches in non-ascii languages like Chinese when selecting multiple items", ->
    div = new Element("div")
    div.update("""
      <select multiple>
        <option value="一">一</option>
        <option value="二">二</option>
        <option value="三">三</option>
        <option value="四">四</option>
        <option value="五">五</option>
        <option value="六">六</option>
        <option value="七">七</option>
        <option value="八">八</option>
        <option value="九">九</option>
        <option value="十">十</option>
        <option value="十一">十一</option>
        <option value="十二">十二</option>
      </select>
    """)

    new Chosen(div.down("select"))
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"))
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".active-result").length).toBe(12)

    search_field = div.down(".chosen-search-input")
    search_field.value = "一"
    mockKeyEvt = { which: 1 }
    chosen_inst.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(1)
    expect(div.select(".active-result")[0].innerHTML).toBe("<em>一</em>")

  it "matches in non-ascii languages like Chinese when selecting multiple items with search_contains", ->
    div = new Element("div")
    div.update("""
      <select multiple>
        <option value="一">一</option>
        <option value="二">二</option>
        <option value="三">三</option>
        <option value="四">四</option>
        <option value="五">五</option>
        <option value="六">六</option>
        <option value="七">七</option>
        <option value="八">八</option>
        <option value="九">九</option>
        <option value="十">十</option>
        <option value="十一">十一</option>
        <option value="十二">十二</option>
      </select>
    """)

    new Chosen(div.down("select"), {search_contains: true})
    container = div.down(".chosen-container")
    chosen_inst = new Chosen(div.down("select"), {search_contains: true})
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_inst.container_mousedown(mockEvt)

    expect(div.select(".active-result").length).toBe(12)

    search_field = div.down(".chosen-search-input")
    search_field.value = "一"
    mockKeyEvt = { which: 1 }
    chosen_inst.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(2)
    expect(div.select(".active-result")[0].innerHTML).toBe("<em>一</em>")
    expect(div.select(".active-result")[1].innerHTML).toBe("十<em>一</em>")

  it "highlights results correctly when multiple words are present", ->
    div = new Element("div")
    div.update("""
      <select>
        <option value="oh hello">oh hello</option>
      </select>
    """)

    new Chosen(div.down("select"))
    simulant.fire(div.down(".chosen-container"), "mousedown") # open the drop

    expect(div.select(".active-result").length).toBe(1)

    search_field = div.down(".chosen-search-input")
    search_field.value = "h"
    simulant.fire(search_field, "keyup")

    expect(div.select(".active-result").length).toBe(1)
    expect(div.select(".active-result")[0].innerHTML).toBe("oh <em>h</em>ello")

  describe "respects word boundaries when not using search_contains", ->
    div = new Element("div")
    div.update("""
      <select>
        <option value="(lparen">(lparen</option>
        <option value="&lt;langle">&lt;langle</option>
        <option value="[lbrace">[lbrace</option>
        <option value="{lcurly">{lcurly</option>
        <option value="¡upsidedownbang">¡upsidedownbang</option>
        <option value="¿upsidedownqmark">¿upsidedownqmark</option>
        <option value=".period">.period</option>
        <option value="-dash">-dash</option>
        <option value='"leftquote'>"leftquote</option>
        <option value="'leftsinglequote">'leftsinglequote</option>
        <option value="“angledleftquote">“angledleftquote</option>
        <option value="‘angledleftsinglequote">‘angledleftsinglequote</option>
        <option value="«guillemet">«guillemet</option>
      </select>
    """)

    new Chosen(div.down("select"))
    simulant.fire(div.down(".chosen-container"), "mousedown") # open the drop

    search_field = div.down(".chosen-search-input")

    div.select("option").forEach (option) ->
      boundary_thing = option.value.slice(1)
      it "correctly finds words that start after a(n) #{boundary_thing}", ->
        search_field.value = boundary_thing
        simulant.fire(search_field, "keyup")
        expect(div.select(".active-result").length).toBe(1)
        expect(div.select(".active-result")[0].innerText.slice(1)).toBe(boundary_thing)

  it "should not raise SyntaxError when search text is extremely long", ->
    div = new Element("div")
    div.innerHTML = """
      <select>
        <option value="Item 1">Item 1</option>
        <option value="Item 2">Item 2</option>
      </select>
    """

    select = div.down("select")
    new Chosen(select)
    container = div.down(".chosen-container")
    simulant.fire(container, "mousedown") # open the drop

    # Create an extremely long search string (much longer than the max_search_length default of 1000)
    search_field = div.down(".chosen-search-input")
    very_long_string = new Array(2000).join("x")

    # This should not throw a "Regular expression too large" SyntaxError
    expect(() ->
      search_field.value = very_long_string
      simulant.fire(search_field, "keyup")
    ).not.toThrow()

    # Should show no results
    expect(div.select(".active-result").length).toBe(0)

  it "should support normalize_search_text callback for searching with accented characters", ->
    # Simple normalize function that removes accents
    removeAccents = (str) ->
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    div = new Element("div")
    document.body.insert(div)
    div.update("""
      <select>
        <option value="cafe">Café</option>
        <option value="mexico">México</option>
        <option value="peru">Perú</option>
        <option value="brasil">Brasil</option>
      </select>
    """)

    select = div.down("select")
    chosen = new Chosen(select, {normalize_search_text: removeAccents})

    container = div.down(".chosen-container")
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)

    expect(div.select(".active-result").length).toBe(4)

    # Search for "cafe" should match "Café"
    search_field = div.down(".chosen-search-input")
    search_field.value = "cafe"
    mockKeyEvt = { which: 1 }
    chosen.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(1)
    # The highlighted result should still show the original text with accents
    expect(div.down(".active-result").innerHTML).toContain("Café")

  it "should properly highlight normalized matches", ->
    # Simple normalize function that removes accents
    removeAccents = (str) ->
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    div = new Element("div")
    document.body.insert(div)
    div.update("""
      <select>
        <option value="cafe">Café</option>
        <option value="test">Testé</option>
      </select>
    """)

    select = div.down("select")
    chosen = new Chosen(select, {normalize_search_text: removeAccents})

    container = div.down(".chosen-container")
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)

    # Search for "test" should match "Testé" and highlight properly
    search_field = div.down(".chosen-search-input")
    search_field.value = "test"
    mockKeyEvt = { which: 1 }
    chosen.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(1)
    # The highlighted result should show "Testé" with proper highlighting
    result_html = div.down(".active-result").innerHTML
    expect(result_html).toContain("<em>")
    expect(result_html).toContain("Testé")

  it "should work with normalize_search_text and search_contains", ->
    # Simple normalize function that removes accents
    removeAccents = (str) ->
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    div = new Element("div")
    document.body.insert(div)
    div.update("""
      <select>
        <option value="paris">Île-de-France</option>
        <option value="oslo">Østlandet</option>
        <option value="zurich">Zürich</option>
      </select>
    """)

    select = div.down("select")
    chosen = new Chosen(select, {normalize_search_text: removeAccents, search_contains: true})

    container = div.down(".chosen-container")
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)

    # Search for "ile" should match "Île-de-France"
    search_field = div.down(".chosen-search-input")
    search_field.value = "ile"
    mockKeyEvt = { which: 1 }
    chosen.keyup_checker(mockKeyEvt)

    expect(div.select(".active-result").length).toBe(1)
    expect(div.down(".active-result").innerHTML).toContain("Île")
