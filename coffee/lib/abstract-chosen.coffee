class AbstractChosen

  constructor: (@form_field, options={}, defaults) ->
    @options = options
    defaults ?= @constructor.defaults
    data_options = this.data_attribute_options()
    if (defaults? and typeof defaults is "object") or data_options?
      merged_options = {}
      has_overrides = false
      if defaults? and typeof defaults is "object"
        for own key, value of defaults
          merged_options[key] = value
          has_overrides = true
      if data_options?
        for own key, value of data_options
          merged_options[key] = value
          has_overrides = true
      if has_overrides
        for own key, value of options
          merged_options[key] = value
        @options = merged_options
    return unless AbstractChosen.browser_is_supported()
    form_field_had_focus = document.activeElement is @form_field
    @result_id_base = if @form_field.id then "#{@form_field.id}-chosen" else "chosen-#{++AbstractChosen.next_id}"
    @is_multiple = @form_field.multiple
    @can_select_by_group = @form_field.getAttribute('select-by-group') isnt null
    this.set_default_text()
    this.set_default_values()

    this.setup()

    this.set_up_html()
    this.register_observers()
    this.transfer_focus() if form_field_had_focus
    # instantiation done, fire ready
    this.on_ready()

  data_attribute_options: ->
    parsed_options = {}
    has_options = false
    for attribute in @form_field.attributes
      continue unless attribute.name.indexOf('data-') is 0
      key = attribute.name.substr(5).replace(/-/g, '_')
      continue unless attribute.name is "data-#{key.replace(/_/g, '-')}"
      continue unless Object::hasOwnProperty.call(AbstractChosen.data_attribute_types, key)
      type = AbstractChosen.data_attribute_types[key]
      value = attribute.value
      switch type
        when 'boolean'
          continue unless value is 'true' or value is 'false'
          parsed = value is 'true'
        when 'integer'
          continue unless /^[0-9]+$/.test(value)
          parsed = Number(value)
          continue unless isFinite(parsed) and parsed <= 9007199254740991
        when 'width'
          continue unless value.length
          parsed = if value is 'false' then false else value
        when 'css-width'
          continue unless value.length
          parsed = value
        when 'search-input-type'
          continue unless value is 'search' or value is 'text'
          parsed = value
        when 'dropdown-position'
          continue unless value is 'absolute' or value is 'fixed'
          parsed = value
        else
          parsed = value
      parsed_options[key] = parsed
      has_options = true
    if has_options then parsed_options else null

  transfer_focus: ->
    if @is_multiple
      this.activate_field()
    else
      (@selected_item[0] or @selected_item).focus()

  set_default_values: ->
    @click_test_action = (evt) => this.test_active_click(evt)
    @activate_action = (evt) => this.activate_field(evt)
    @active_field = false
    @mouse_on_container = false
    @mouse_on_label = false
    @composing = false
    @ignore_composition_enter = false
    @last_search_value = ""
    @typeahead_search = ""
    @typeahead_timeout = null
    @results_showing = false
    @result_highlighted = null
    @is_rtl = @options.rtl || /\bchosen-rtl\b/.test(@form_field.className)
    this.update_allow_single_deselect()
    @disable_search_threshold = @options.disable_search_threshold || 0
    @disable_search = @options.disable_search || false
    @enable_split_word_search = if @options.enable_split_word_search? then @options.enable_split_word_search else true
    @group_search = if @options.group_search? then @options.group_search else true
    @search_in_values = @options.search_in_values || false
    @search_contains = @options.search_contains || false
    @highlight_prefix_matches = @options.highlight_prefix_matches is true
    @search_matcher = if typeof @options.search_matcher is "function" then @options.search_matcher else null
    @search_input_type = if @options.search_input_type is "text" then "text" else "search"
    @fixed_dropdown = @options.dropdown_position is "fixed"
    @recalculate_width_on_update = @options.recalculate_width_on_update || false
    @split_search_terms = @options.split_search_terms || false
    @paste_multiple_values = @options.paste_multiple_values is true
    @backspace_deletes_choices = if @options.backspace_deletes_choices? then @options.backspace_deletes_choices else true
    @single_backstroke_delete = if @options.single_backstroke_delete? then @options.single_backstroke_delete else true
    @multiselect_allow_tab_to_select = @options.multiselect_allow_tab_to_select || false
    @allow_select_all = @options.allow_select_all || false
    @allow_deselect_all = @options.allow_deselect_all || false
    @deselect_selected_results = @options.deselect_selected_results || false
    @select_all_text = @options.select_all_text || AbstractChosen.default_select_all_text
    @deselect_all_text = @options.deselect_all_text || AbstractChosen.default_deselect_all_text
    @open_on_label_click = if @options.open_on_label_click? then @options.open_on_label_click else @is_multiple
    @max_selected_options = @options.max_selected_options || Infinity
    @max_items_shown = if typeof @options.max_items_shown is 'number' and isFinite(@options.max_items_shown) and @options.max_items_shown > 0 and Math.floor(@options.max_items_shown) is @options.max_items_shown then @options.max_items_shown else Infinity
    @more_items_text = @options.more_items_text || (count) -> "Show #{count} more..."
    @show_fewer_items_text = @options.show_fewer_items_text || "Show fewer..."
    @choices_expanded = false
    @inherit_select_classes = @options.inherit_select_classes || false
    @inherit_option_classes = @options.inherit_option_classes || false
    @inherit_optgroup_classes = @options.inherit_optgroup_classes || false
    @display_selected_options = if @options.display_selected_options? then @options.display_selected_options else true
    @display_disabled_options = if @options.display_disabled_options? then @options.display_disabled_options else true
    @display_selected_value = @options.display_selected_value || false
    @parser_config = @options.parser_config || {}
    @include_group_label_in_selected = @options.include_group_label_in_selected || false
    @max_shown_results = @options.max_shown_results || Number.POSITIVE_INFINITY
    @case_sensitive_search = @options.case_sensitive_search || false
    @hide_results_on_select = if @options.hide_results_on_select? then @options.hide_results_on_select else true
    @normalize_search_text = @options.normalize_search_text || (search_text) -> search_text
    @create_option = @options.create_option || false
    @persistent_create_option = @options.persistent_create_option || false
    @skip_no_results = @options.skip_no_results || false
    @max_search_length = @options.max_search_length || 1000
    @min_search_length = Math.max(0, parseInt(@options.min_search_length, 10) || 0)
    @search_delay = Math.max(0, parseInt(@options.search_delay, 10) || 0)
    @pending_search_timeout = null
    @results_count_text = @options.results_count_text || (count) -> "#{count} #{if count is 1 then 'result' else 'results'} available"

  set_default_text: ->
    data_placeholder = @form_field.getAttribute("data-placeholder")
    placeholder = @form_field.getAttribute("placeholder")
    if data_placeholder?
      @default_text = data_placeholder
    else if placeholder?
      @default_text = placeholder
    else if @is_multiple
      if @options.placeholder_text_multiple?
        @default_text = @options.placeholder_text_multiple
      else if @options.placeholder_text?
        @default_text = @options.placeholder_text
      else
        @default_text = AbstractChosen.default_multiple_text
    else
      if @options.placeholder_text_single?
        @default_text = @options.placeholder_text_single
      else if @options.placeholder_text?
        @default_text = @options.placeholder_text
      else
        @default_text = AbstractChosen.default_single_text

    # Unescape any HTML entities that might have been incorrectly included
    @default_text = this.unescape_html(@default_text)

    @results_none_found = @form_field.getAttribute("data-no_results_text") || @options.no_results_text || AbstractChosen.default_no_result_text
    @no_results_template = @options.no_results_template
    @create_option_text = @form_field.getAttribute("data-create_option_text") || @options.create_option_text || AbstractChosen.default_create_option_text

  open_field: ->
    return if @is_disabled or @results_showing
    this.activate_field()
    this.results_show()

  handle_form_reset: ->
    clearTimeout(@form_reset_timeout) if @form_reset_timeout?
    @form_reset_timeout = setTimeout((=>
      @form_reset_timeout = null
      this.results_update_field()
    ), 0)

  choice_label: (item) ->
    label = if @display_selected_value then this.escape_html(item.value) else item.html
    if @include_group_label_in_selected and item.group_label?
      "<b class='group-name'>#{this.escape_html(item.group_label)}</b>#{label}"
    else
      label

  update_choice_visibility: ->
    return unless @is_multiple and @max_items_shown < Infinity

    choices = @search_choices[0] or @search_choices
    search = @search_container[0] or @search_container
    items = choices.querySelectorAll('li.search-choice')
    hidden_count = Math.max(0, items.length - @max_items_shown)
    @choices_expanded = false unless hidden_count

    for item, index in items
      if hidden_count > 0 and not @choices_expanded and index >= @max_items_shown
        item.setAttribute('hidden', 'hidden')
      else
        item.removeAttribute('hidden')

    if hidden_count
      unless @choice_summary?
        @choice_summary = document.createElement('li')
        @choice_summary.className = 'chosen-choice-summary'
        @choice_summary_button = document.createElement('button')
        @choice_summary_button.type = 'button'
        @choice_summary.appendChild(@choice_summary_button)
        @choice_summary_button.addEventListener 'mousedown', (evt) -> evt.stopPropagation()
        @choice_summary_button.addEventListener 'touchstart', (evt) -> evt.stopPropagation()
        @choice_summary_button.addEventListener 'click', (evt) =>
          evt.preventDefault()
          evt.stopPropagation()
          @choices_expanded = not @choices_expanded
          this.update_choice_visibility()
          @choice_summary_button.focus()
      @choice_summary_button.textContent = if @choices_expanded then @show_fewer_items_text else @more_items_text(hidden_count)
      @choice_summary_button.setAttribute('aria-expanded', String(@choices_expanded))
      choices.insertBefore(@choice_summary, search)
    else if @choice_summary?.parentNode
      @choice_summary.parentNode.removeChild(@choice_summary)

  mouse_enter: -> @mouse_on_container = true
  mouse_leave: -> @mouse_on_container = false

  input_focus: (evt) ->
    if @is_multiple
      setTimeout (=> this.container_mousedown() if document.activeElement is (@search_field[0] or @search_field)), 50 unless @active_field
    else
      @activate_field() unless @active_field

  input_blur: (evt) ->
    if not @mouse_on_container and not @mouse_on_label
      @active_field = false
      setTimeout (=> this.blur_test()), 100

  label_mousedown_handler: (evt) =>
    @mouse_on_label = true
    setTimeout (=> @mouse_on_label = false), 0

  label_click_handler: (evt) =>
    selection = window.getSelection?()
    label = evt.currentTarget
    if selection?.toString().length and label?.contains? and (label.contains(selection.anchorNode) or label.contains(selection.focusNode))
      evt.preventDefault()
      return
    if @open_on_label_click
      this.container_mousedown(evt)
    else
      this.activate_field()

  results_option_build: (options) ->
    content = ''
    rendered_results = 0
    result_index = 0
    first_result = 0
    keep_scanning_for_pinned = this.get_search_field_value().length > 0 and @results_data.some((data) -> data.always_visible)

    if not @is_multiple and @max_shown_results < Number.POSITIVE_INFINITY and this.get_search_field_value().length is 0
      selected_result_index = 0
      for data in @results_data when this.result_is_visible(data)
        if data.selected
          first_result = Math.max(0, selected_result_index - @max_shown_results + 1)
          break
        selected_result_index++

    for data in @results_data
      if this.result_is_visible(data)
        if (result_index >= first_result and rendered_results < @max_shown_results) or data.pinned_visible
          data_content = if data.group then this.result_add_group(data) else this.result_add_option(data)
          if data_content != ''
            rendered_results++ unless data.pinned_visible
            content += data_content
        result_index++

      # this select logic pins on an awkward flag
      # we can make it better
      if options?.first
        if data.selected and @is_multiple
          this.choice_build data
        else if data.selected and not @is_multiple
          this.single_set_selected_text(this.choice_label(data))

      if rendered_results >= @max_shown_results and not (options?.first and @is_multiple) and not keep_scanning_for_pinned
        break

    if @is_multiple
      content = this.bulk_actions_html() + content

    content

  bulk_actions_html: ->
    actions = []
    actions.push ['select-all', @select_all_text] if @allow_select_all and this.has_selectable_results()
    actions.push ['deselect-all', @deselect_all_text] if @allow_deselect_all and this.has_deselectable_results()
    content = ''
    for action, index in actions
      content += this.bulk_action_html(action[0], action[1], index is actions.length - 1)
    content

  bulk_action_html: (action, text, is_last) ->
    action_el = document.createElement('li')
    action_el.className = "active-result chosen-bulk-action chosen-#{action}"
    action_el.className += " chosen-bulk-action-last" if is_last
    action_el.id = "#{@result_id_base}-#{action}"
    action_el.setAttribute('data-chosen-action', action)
    action_el.setAttribute('role', 'option')
    action_el.setAttribute('aria-selected', 'false')
    action_el.innerHTML = this.escape_html(text)
    this.outerHTML(action_el)

  has_selectable_results: ->
    for item in @results_data when not item.group and item.search_match and not item.pinned_only and not item.selected and not item.disabled and this.include_option_in_results(item)
      return true if this.current_option_for(item)?
    false

  has_deselectable_results: ->
    for item in @results_data when not item.group and item.selected and not item.disabled
      return true if this.current_option_for(item)?
    false

  select_all_results: ->
    changed = false
    limit_reached = false
    selected_count = this.choices_count()

    for item in @results_data when not item.group and item.search_match and not item.pinned_only and not item.selected and not item.disabled and this.include_option_in_results(item)
      option = this.current_option_for(item)
      continue unless option?
      if ChosenCore.selectionLimitReached(selected_count, @max_selected_options)
        limit_reached = true
        break
      item.selected = true
      option.selected = true
      selected_count++
      changed = true

    @selected_option_count = null
    this.finish_bulk_action() if changed
    this.trigger_max_selected() if limit_reached
    changed

  deselect_all_results: ->
    changed = false
    for item in @results_data when not item.group and item.selected and not item.disabled
      option = this.current_option_for(item)
      continue unless option?
      item.selected = false
      option.selected = false
      changed = true

    @selected_option_count = null
    this.finish_bulk_action() if changed
    changed

  finish_bulk_action: ->
    this.results_update_field()
    this.trigger_form_field_change()
    this.search_field_scale()
    (@search_field[0] or @search_field).focus()

  result_is_visible: (data) ->
    if data.group
      (data.search_match or data.group_match) and data.active_options > 0
    else
      data.search_match and this.include_option_in_results(data)

  result_add_option: (option) ->
    return '' unless option.search_match
    return '' unless this.include_option_in_results(option)

    classes = []
    classes.push "active-result" if !option.disabled and !(option.selected and @is_multiple and not @deselect_selected_results)
    classes.push "disabled-result" if option.disabled and !(option.selected and @is_multiple)
    classes.push "result-selected" if option.selected
    classes.push "chosen-result-deselectable" if @is_multiple and @deselect_selected_results and option.selected and not option.disabled
    classes.push "group-option" if option.group_array_index?
    classes.push option.classes if option.classes != ""

    option_el = document.createElement("li")
    option_el.className = classes.join(" ")
    option_el.style.cssText = option.style if option.style
    for attrName of option.data
      if option.data.hasOwnProperty(attrName)
        option_el.setAttribute(attrName, option.data[attrName])
    option_el.setAttribute("role", "option")
    option_el.setAttribute("aria-selected", if option.selected then "true" else "false")
    option_el.innerHTML = option.highlighted_html or option.html
    option_el.id = "#{@result_id_base}-search-result-#{option.data['data-option-array-index']}"
    option_el.title = option.title if option.title

    this.outerHTML(option_el)

  result_add_group: (group) ->
    return '' unless group.search_match || group.group_match
    return '' unless group.active_options > 0

    classes = []
    classes.push "group-result"
    classes.push group.classes if group.classes

    group_el = document.createElement("li")
    group_el.className = classes.join(" ")
    group_el.innerHTML = group.highlighted_html or this.escape_html(group.label)
    group_el.title = group.title if group.title

    this.outerHTML(group_el)

  append_option: (option) ->
    this.select_append_option(option)

  results_update_field: ->
    active_query = this.get_search_field_value() if @results_showing
    this.set_default_text()
    this.update_allow_single_deselect()
    this.sync_container_title()
    this.sync_container_classes()
    this.set_aria_labels()
    this.results_reset_cleanup() if not @is_multiple
    this.result_clear_highlight()
    this.results_build()
    if @results_showing
      search_input = @search_field[0] or @search_field
      search_input.value = active_query
      this.winnow_results()
    this.recalculate_container_width() if @recalculate_width_on_update

  update_allow_single_deselect: ->
    first_option = @form_field.options[0]
    @allow_single_deselect = Boolean(@options.allow_single_deselect and first_option? and first_option.text is "" and first_option.value is "")

  sync_container_title: ->
    container = @container[0] or @container
    if @form_field.hasAttribute("title")
      container.setAttribute("title", @form_field.title)
    else
      container.removeAttribute("title")

  select_class_names: ->
    (class_name for class_name in @form_field.className.split(/\s+/) when class_name.length)

  sync_container_classes: ->
    return unless @inherit_select_classes

    container = @container[0] or @container
    current_classes = (class_name for class_name in container.className.split(/\s+/) when class_name.length and class_name not in @inherited_select_classes)
    @inherited_select_classes = this.select_class_names()
    current_classes.push(class_name) for class_name in @inherited_select_classes when class_name not in current_classes
    container.className = current_classes.join(" ")

  reset_single_select_options: () ->
    for result in @results_data
      result.selected = false if result.selected

  current_option_for: (item) ->
    return null unless item?
    option = @form_field.options[item.options_index]
    return option if option? and option is item.option_element
    null

  results_toggle: ->
    if @results_showing
      this.results_hide()
    else
      this.results_show()

  results_search: (evt) ->
    this.cancel_pending_search()
    @last_search_value = this.get_search_field_value()
    if @results_showing
      this.winnow_results()
    else
      this.results_show()
    @form_field_jq.trigger("chosen:search", {chosen: this})

  search_if_value_changed: ->
    return if @composing or this.get_search_field_value() is @last_search_value

    if @search_delay > 0
      this.cancel_pending_search()
      @pending_search_timeout = setTimeout((=>
        @pending_search_timeout = null
        this.results_search() if not @composing and this.get_search_field_value() isnt @last_search_value
      ), @search_delay)
    else
      this.results_search()

  flush_pending_search: ->
    return unless @pending_search_timeout?
    this.cancel_pending_search()
    this.results_search() if not @composing and this.get_search_field_value() isnt @last_search_value

  cancel_pending_search: ->
    clearTimeout(@pending_search_timeout) if @pending_search_timeout?
    @pending_search_timeout = null

  composition_start: ->
    @composing = true

  composition_end: ->
    @composing = false
    @ignore_composition_enter = true
    setTimeout (=> @ignore_composition_enter = false), 0
    setTimeout (=> this.search_if_value_changed()), 0

  winnow_results: (options) ->
    this.no_results_clear()

    results = 0
    exact_result = false

    @last_search_value = this.get_search_field_value()
    query = this.get_search_text()
    # Truncate query to prevent "Regular expression too large" errors
    query = query.substring(0, @max_search_length) if query.length > @max_search_length

    if query.length < @min_search_length
      this.update_results_content ""
      this.result_clear_highlight()
      this.fire_search_updated query
      this.update_empty_results_state()
      this.clear_results_count()
      return

    if @search_matcher
      escaped_query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
      exact_regex = new RegExp("^#{escaped_query}$")
    else
      matcher = ChosenCore.createMatcher(query,
        normalizeSearchText: (text) => this.normalize_search_text(text)
        createSearchRegex: (escaped) => this.get_search_regex(escaped)
        searchStringMatch: (text, regex) => this.search_string_match(text, regex)
        caseSensitiveSearch: @case_sensitive_search
        enableSplitWordSearch: @enable_split_word_search
        searchContains: @search_contains
        searchInValues: @search_in_values
        splitSearchTerms: @split_search_terms
      )
      normalized_terms = matcher.terms

    for option in @results_data

      option.search_match = false
      option.pinned_visible = Boolean(query.length and option.always_visible)
      option.pinned_only = false
      results_group = null
      search_match = null
      match_alternate_text = false
      option.highlighted_html = ''

      if this.include_option_in_results(option)

        if option.group
          option.group_match = false
          option.active_options = 0
          option.pinned_visible = false

        if option.group_array_index? and @results_data[option.group_array_index]
          results_group = @results_data[option.group_array_index]
          results += 1 if results_group.active_options is 0 and results_group.search_match
          results_group.active_options += 1

        text = if option.group then option.label else option.text

        unless option.group and not @group_search and not @search_matcher
          if @search_matcher
            option.search_match = Boolean(@search_matcher(query, option))
          else
            match = matcher(
              label: text
              searchText: option.search_text
              value: option.value
              exactText: if option.group then '' else option.html
            )
            normalized_text = match.normalizedText
            search_matches = match.termMatches
            search_match = match.primaryMatch
            option.search_match = match.matched
            match_alternate_text = match.alternate

          matched_query = option.search_match
          option.pinned_only = option.pinned_visible and not matched_query
          option.search_match = matched_query or option.pinned_visible
          results_group.pinned_visible = true if results_group? and option.pinned_visible

          results += 1 if option.search_match and not option.group

          if @search_matcher
            exact_result = exact_result || exact_regex.test option.html
          else
            exact_result = exact_result || match.exact

          if option.search_match
            if matched_query and not @search_matcher and query.length and not match_alternate_text and normalized_terms.length > 1
              option.highlighted_html = this.highlight_search_terms(text, normalized_text, search_matches, normalized_terms)
            else if matched_query and not @search_matcher and query.length and not match_alternate_text
              startpos = search_match.index

              # If normalization changed the text, we need to find the correct
              # highlighting boundaries in the original (non-normalized) text.
              # Note: This algorithm has O(n²) complexity due to repeated normalization.
              # For most use cases with short option text (typically <100 chars),
              # performance impact is minimal and negligible compared to DOM operations.
              if normalized_text != text
                # When using normalization, highlight the full matched portion
                # Get the actual matched length, accounting for boundary character in capture group
                # search_match[1] contains the boundary character (space) if it was matched
                # search_match[0] contains the full match including the boundary
                matched_length_in_normalized = search_match[0].length
                matched_length_in_normalized -= 1 if search_match[1] # subtract boundary char if present

                # Find where the match starts in the original text by comparing
                # normalized prefixes of the original text
                startpos = 0
                for i in [0...text.length] by 1
                  prefix_normalized = this.normalize_search_text(text.substring(0, i))
                  if prefix_normalized.length >= search_match.index
                    startpos = i
                    break

                # Find the length of the match in the original text
                # by finding where the normalized substring from startpos reaches the matched length
                match_length = 0
                for i in [startpos...text.length + 1] by 1
                  substr_normalized = this.normalize_search_text(text.substring(startpos, i))
                  if substr_normalized.length >= matched_length_in_normalized
                    match_length = i - startpos
                    break
              else
                # When text doesn't change after normalization, use the query length
                # This highlights only what the user typed, not the entire matched word
                match_length = query.length

              prefix = text.slice(0, startpos)
              fix    = text.slice(startpos, startpos + match_length)
              suffix = text.slice(startpos + match_length)
              option.highlighted_html = "#{this.escape_html(prefix)}<em>#{this.escape_html(fix)}</em>#{this.escape_html(suffix)}"

            results_group.group_match = true if results_group?

          else if option.group_array_index? and @results_data[option.group_array_index].search_match
            option.search_match = true

    this.result_clear_highlight()

    if results < 1 and query.length
      this.update_results_content ""
      this.fire_search_updated query
      this.no_results query unless @create_option and @skip_no_results
    else
      this.update_results_content this.results_option_build()
      this.fire_search_updated query
      this.winnow_results_set_highlight() unless options?.skip_highlight

    if @create_option and (results < 1 or (!exact_result and @persistent_create_option)) and query.length
      this.show_create_option( query )

    this.update_empty_results_state()
    this.announce_results_count()

  announce_results_count: ->
    status = @results_status[0] or @results_status
    results = @search_results[0] or @search_results
    count = results.querySelectorAll('[role="option"]:not([data-chosen-action])').length
    status.textContent = @results_count_text(count)

  clear_results_count: ->
    status = @results_status[0] or @results_status
    status.textContent = ""

  get_search_regex: (escaped_search_string) ->
    regex_string = if @search_contains then escaped_search_string else "(^|\\s|\\b)#{escaped_search_string}[^\\s]*"
    regex_string = "^#{regex_string}" unless @enable_split_word_search
    regex_flag = if @case_sensitive_search then "" else "i"
    new RegExp(regex_string, regex_flag)

  get_highlight_regex: (escaped_search_string) ->
    regex_anchor = if @search_contains then "" else "\\b"
    regex_flag = if @case_sensitive_search then "" else "i"
    new RegExp(regex_anchor + escaped_search_string, regex_flag)

  highlight_search_terms: (text, normalized_text, matches, normalized_terms) ->
    ranges = []
    for match, index in matches when match?
      start = match.index
      finish = start + normalized_terms[index].length
      if normalized_text != text
        start = this.original_index_for_normalized(text, start, false)
        finish = this.original_index_for_normalized(text, finish, true)
      ranges.push({start, finish}) if finish > start

    ranges.sort (left, right) -> left.start - right.start
    merged = []
    for range in ranges
      previous = merged[merged.length - 1]
      if previous? and range.start <= previous.finish
        previous.finish = Math.max(previous.finish, range.finish)
      else
        merged.push({start: range.start, finish: range.finish})

    highlighted = ''
    cursor = 0
    for range in merged
      highlighted += this.escape_html(text.slice(cursor, range.start))
      highlighted += "<em>#{this.escape_html(text.slice(range.start, range.finish))}</em>"
      cursor = range.finish
    highlighted + this.escape_html(text.slice(cursor))

  original_index_for_normalized: (text, normalized_index, end_index) ->
    return 0 if normalized_index <= 0
    for i in [1..text.length]
      length = this.normalize_search_text(text.substring(0, i)).length
      return i if end_index and length >= normalized_index
      return i - 1 if not end_index and length > normalized_index
    text.length

  get_list_special_char: () ->
    chars = []
    chars.push { val: "ae", let: "(ä|æ|ǽ)" }
    chars.push { val: "oe", let: "(ö|œ)" }
    chars.push { val: "ue", let: "(ü)" }
    chars.push { val: "Ae", let: "(Ä)" }
    chars.push { val: "Ue", let: "(Ü)" }
    chars.push { val: "Oe", let: "(Ö)" }
    chars.push { val: "AE", let: "(Æ|Ǽ)" }
    chars.push { val: "ss", let: "(ß)" }
    chars.push { val: "IJ", let: "(Ĳ)" }
    chars.push { val: "ij", let: "(ĳ)" }
    chars.push { val: "OE", let: "(Œ)" }
    chars.push { val: "A", let: "(À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ)" }
    chars.push { val: "a", let: "(à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª)" }
    chars.push { val: "C", let: "(Ç|Ć|Ĉ|Ċ|Č)" }
    chars.push { val: "c", let: "(ç|ć|ĉ|ċ|č)" }
    chars.push { val: "D", let: "(Ð|Ď|Đ)" }
    chars.push { val: "d", let: "(ð|ď|đ)" }
    chars.push { val: "E", let: "(È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě)" }
    chars.push { val: "e", let: "(è|é|ê|ë|ē|ĕ|ė|ę|ě)" }
    chars.push { val: "G", let: "(Ĝ|Ğ|Ġ|Ģ)" }
    chars.push { val: "g", let: "(ĝ|ğ|ġ|ģ)" }
    chars.push { val: "H", let: "(Ĥ|Ħ)" }
    chars.push { val: "h", let: "(ĥ|ħ)" }
    chars.push { val: "I", let: "(Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ)" }
    chars.push { val: "i", let: "(ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı)" }
    chars.push { val: "J", let: "(Ĵ)" }
    chars.push { val: "j", let: "(ĵ)" }
    chars.push { val: "K", let: "(Ķ)" }
    chars.push { val: "k", let: "(ķ)" }
    chars.push { val: "L", let: "(Ĺ|Ļ|Ľ|Ŀ|Ł)" }
    chars.push { val: "l", let: "(ĺ|ļ|ľ|ŀ|ł)" }
    chars.push { val: "N", let: "(Ñ|Ń|Ņ|Ň)" }
    chars.push { val: "n", let: "(ñ|ń|ņ|ň|ŉ)" }
    chars.push { val: "O", let: "(Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ)" }
    chars.push { val: "o", let: "(ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º)" }
    chars.push { val: "R", let: "(Ŕ|Ŗ|Ř)" }
    chars.push { val: "r", let: "(ŕ|ŗ|ř)" }
    chars.push { val: "S", let: "(Ś|Ŝ|Ş|Š)" }
    chars.push { val: "s", let: "(ś|ŝ|ş|š|ſ)" }
    chars.push { val: "T", let: "(Ţ|Ť|Ŧ)" }
    chars.push { val: "t", let: "(ţ|ť|ŧ)" }
    chars.push { val: "U", let: "(Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ)" }
    chars.push { val: "u", let: "(ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ)" }
    chars.push { val: "Y", let: "(Ý|Ÿ|Ŷ)" }
    chars.push { val: "y", let: "(ý|ÿ|ŷ)" }
    chars.push { val: "W", let: "(Ŵ)" }
    chars.push { val: "w", let: "(ŵ)" }
    chars.push { val: "Z", let: "(Ź|Ż|Ž)" }
    chars.push { val: "z", let: "(ź|ż|ž)" }
    chars.push { val: "f", let: "(ƒ)" }
    chars

  escape_special_char: (str) ->
    specialChars = this.get_list_special_char()
    for special in specialChars
      str = str.replace(new RegExp(special.let, "g"), special.val)
    str

  search_aria_attributes: ->
    # These attributes describe state owned by Chosen's generated combobox.
    managed = /^(aria-(activedescendant|autocomplete|busy|controls|disabled|expanded|haspopup|hidden|owns))$/
    (attribute for attribute in @form_field.attributes when /^aria-/.test(attribute.name) and not managed.test(attribute.name))

  search_string_match: (search_string, regex) ->
    match = regex.exec(search_string)
    match = regex.exec(this.escape_special_char(search_string)) if not @case_sensitive_search && not match?
    match.index += 1 if not @search_contains && match?[1] # make up for lack of lookbehind operator in regex
    match

  choices_count: ->
    return @selected_option_count if @selected_option_count?

    @selected_option_count = 0
    for option in @form_field.options
      @selected_option_count += 1 if option.selected

    return @selected_option_count

  choices_click: (evt) ->
    evt.preventDefault()
    this.activate_field()
    this.results_show() unless @results_showing or @is_disabled

  mousedown_checker: (evt) ->
    evt = evt || window.event
    mousedown_type = null
    if (!evt.which and evt.button != undefined)
      evt.which = ( evt.button & 1 ? 1 : ( evt.button & 2 ? 3 : ( evt.button & 4 ? 2 : 0 ) ) )

    switch evt.which
      when 1
        mousedown_type = 'left'
        break
      when 2
        mousedown_type = 'right'
        break
      when 3
        mousedown_type = 'middle'
        break
      else
        mousedown_type = 'other'

    return mousedown_type

  selected_item_keydown: (evt) ->
    return if @is_disabled

    stroke = evt.which ? evt.keyCode
    if stroke in [8, 46] and @allow_single_deselect and @form_field.selectedIndex > 0
      evt.preventDefault()
      this.results_reset()
    else if stroke in [13, 32]
      evt.preventDefault()
      @ignore_enter_keyup = true if stroke is 13
      this.results_toggle()
    else if stroke in [33, 34, 35, 36]
      evt.preventDefault()
      this.results_show()
      switch stroke
        when 33 then this.keypage(-1)
        when 34 then this.keypage(1)
        when 35 then this.keyend()
        when 36 then this.keyhome()
    else if not evt.altKey and not evt.ctrlKey and not evt.metaKey
      search_field = @search_field[0] or @search_field
      return if search_field.readOnly
      character = if evt.key? then (if evt.key.length is 1 then evt.key else "") else if 48 <= stroke <= 90 then String.fromCharCode(stroke) else ""
      return unless character.length and /\S/.test(character)
      evt.preventDefault()
      this.results_show()
      search_field.value = character
      this.search_if_value_changed()

  keydown_checker: (evt) ->
    stroke = evt.which ? evt.keyCode
    return if @composing or evt.isComposing or stroke is 229
    if @is_multiple and stroke is 65 and (evt.metaKey or evt.ctrlKey) and not evt.altKey and this.get_search_field_value().length is 0
      if evt.shiftKey and @allow_deselect_all
        evt.preventDefault()
        this.deselect_all_results()
        return
      else if not evt.shiftKey and @allow_select_all
        evt.preventDefault()
        this.select_all_results()
        return
    this.flush_pending_search() if stroke in [9, 13, 33, 34, 35, 36, 38, 40]
    if @disable_search and not @is_multiple and @results_showing and this.typeahead_search_results(evt)
      evt.preventDefault()
      return
    this.search_field_scale()

    this.clear_backstroke() if stroke != 8 and @pending_backstroke

    switch stroke
      when 8 # backspace
        @backstroke_length = this.get_search_field_value().length
        break
      when 9 # tab
        this.result_select(evt) if @results_showing and (not @is_multiple or @multiselect_allow_tab_to_select)
        @mouse_on_container = false
        break
      when 13 # enter
        evt.preventDefault() if @results_showing
        break
      when 27 # escape
        if @results_showing
          evt.preventDefault()
          evt.stopPropagation()
        break
      when 32 # space
        evt.preventDefault() if @disable_search
        break
      when 33 # page up
        evt.preventDefault()
        this.keypage(-1)
        break
      when 34 # page down
        evt.preventDefault()
        this.keypage(1)
        break
      when 35 # end
        unless this.get_search_field_value().length
          evt.preventDefault()
          this.keyend()
        break
      when 36 # home
        unless this.get_search_field_value().length
          evt.preventDefault()
          this.keyhome()
        break
      when 38 # up arrow
        evt.preventDefault()
        this.keyup_arrow()
        break
      when 40 # down arrow
        evt.preventDefault()
        this.keydown_arrow()
        break

  keyup_checker: (evt) ->
    stroke = evt.which ? evt.keyCode
    if @ignore_composition_enter
      @ignore_composition_enter = false
      return if stroke is 13
    return if @composing or evt.isComposing or stroke is 229
    if @ignore_enter_keyup
      @ignore_enter_keyup = false
      return if stroke is 13
    this.search_field_scale()

    switch stroke
      when 8 # backspace
        if @is_multiple and @backstroke_length < 1 and this.choices_count() > 0
          this.keydown_backstroke()
        else if not @pending_backstroke
          this.result_clear_highlight()
          this.search_if_value_changed()
        break
      when 13 # enter
        evt.preventDefault()
        this.result_select(evt) if this.results_showing
        break
      when 27 # escape
        if @results_showing
          this.results_hide()
          @selected_item.focus() unless @is_multiple
        break
      when 9, 16, 17, 18, 33, 34, 35, 36, 38, 40, 91
        # don't do anything on these keys
      else
        this.search_if_value_changed()
        break

  clipboard_event_checker: (evt) ->
    return if @is_disabled
    return if this.paste_multiple_selection(evt)
    setTimeout (=> this.search_if_value_changed()), 50

  paste_multiple_selection: (evt) ->
    return false unless @is_multiple and @paste_multiple_values and evt.type is 'paste' and not @composing

    input = @search_field[0] or @search_field
    clipboard = evt.originalEvent?.clipboardData or evt.clipboardData
    return false unless clipboard?.getData
    pasted = clipboard.getData('text/plain') or clipboard.getData('Text')
    text = if typeof input.selectionStart is 'number' and typeof input.selectionEnd is 'number' then input.value.slice(0, input.selectionStart) + pasted + input.value.slice(input.selectionEnd) else pasted
    return false unless /[,;\t\r\n]/.test(text)

    tokens = (token.trim() for token in text.split(/[,;\t\r\n]/) when token.trim().length)
    return false unless tokens.length

    remaining = []
    consumed = false
    changed = false
    limit_reached = false
    selected_count = this.choices_count()

    for token in tokens
      matches = (item for item in @results_data when this.paste_item_eligible(item) and item.value is token)
      unless matches.length
        matches = (item for item in @results_data when this.paste_item_eligible(item) and item.text.toLowerCase() is token.toLowerCase())

      if matches.length isnt 1
        remaining.push(token)
        continue

      item = matches[0]
      if item.selected
        consumed = true
      else if ChosenCore.selectionLimitReached(selected_count, @max_selected_options)
        remaining.push(token)
        limit_reached = true
      else
        option = this.current_option_for(item)
        option.selected = true
        item.selected = true
        selected_count++
        consumed = true
        changed = true

    return false unless consumed or limit_reached
    evt.preventDefault()
    input.value = remaining.join(', ')
    if changed
      @selected_option_count = null
      this.results_update_field()
      this.trigger_form_field_change()
    input.value = remaining.join(', ')
    this.trigger_max_selected() if limit_reached
    this.search_if_value_changed() unless limit_reached and not @results_showing
    this.search_field_scale()
    true

  paste_item_eligible: (item) ->
    return false if item.group or item.empty or item.disabled or item.hidden
    return false if item.group_array_index? and @results_data[item.group_array_index].hidden
    option = this.current_option_for(item)
    option? and not option.disabled and not option.hidden

  typeahead_search_results: (evt) ->
    return false if evt.altKey or evt.ctrlKey or evt.metaKey

    stroke = evt.which ? evt.keyCode
    character = if evt.key? and evt.key.length is 1 then evt.key else if 48 <= stroke <= 90 then String.fromCharCode(stroke) else ""
    return false unless character.length and /\S/.test(character)

    query = @typeahead_search + character
    match = this.typeahead_result(query)
    unless match?
      query = character
      match = this.typeahead_result(query)

    @typeahead_search = query
    clearTimeout(@typeahead_timeout) if @typeahead_timeout
    @typeahead_timeout = setTimeout((=> @typeahead_search = ""), 500)
    this.result_do_highlight(match) if match?
    true

  typeahead_result: (query) ->
    normalized_query = @normalize_search_text(query)
    normalized_query = normalized_query.toLowerCase() unless @case_sensitive_search

    for item in @results_data when not item.group and not item.empty and not item.disabled and this.include_option_in_results(item)
      text = @normalize_search_text(item.text)
      text = text.toLowerCase() unless @case_sensitive_search
      return this.result_for_array_index(item.data["data-option-array-index"]) if text.indexOf(normalized_query) is 0
    null

  preferred_prefix_array_index: ->
    return null unless @highlight_prefix_matches and @search_contains and not @search_matcher
    query = this.get_search_text()
    return null unless query.length

    normalized_query = String(@normalize_search_text(query))
    normalized_query = normalized_query.toLowerCase() unless @case_sensitive_search

    for item in @results_data when not item.group and not item.empty and item.search_match and not item.pinned_only and not item.disabled and this.include_option_in_results(item)
      label = String(@normalize_search_text(item.text))
      label = label.toLowerCase() unless @case_sensitive_search
      return item.data['data-option-array-index'] if label.indexOf(normalized_query) is 0
    null

  clear_typeahead: ->
    @typeahead_search = ""
    clearTimeout(@typeahead_timeout) if @typeahead_timeout
    @typeahead_timeout = null

  container_width: ->
    return @options.width if @options.width?
    return "#{@form_field.offsetWidth}px" if @form_field.offsetWidth > 0
    if window.getComputedStyle?
      computed_width = window.getComputedStyle(@form_field).width
      return computed_width if computed_width? and computed_width isnt "auto" and computed_width isnt "0px"
    return "auto"

  recalculate_container_width: ->
    return if @options.width?

    original_display = @form_field.style.display
    @form_field.style.display = "inline-block"
    width = @form_field.offsetWidth
    @form_field.style.display = original_display
    return unless width > 0

    container = @container[0] or @container
    container.style.width = "#{width}px"
    this.update_dropup_position() if @results_showing

  include_option_in_results: (option) ->
    group_hidden = option.group_array_index? and @results_data[option.group_array_index].hidden
    ChosenCore.includeOptionInResults(option,
      multiple: @is_multiple
      displaySelectedOptions: @display_selected_options
      displayDisabledOptions: @display_disabled_options
      groupHidden: group_hidden
    )

  search_results_touchstart: (evt) ->
    @touch_started = true
    this.search_results_mouseover(evt)

  search_results_touchmove: (evt) ->
    @touch_started = false
    this.search_results_mouseout(evt)

  search_results_touchend: (evt) ->
    if @touch_started
      @last_touch_time = Date.now()
      this.search_results_mouseup(evt)
    @touch_started = false

  synthetic_activation_after_touch: (evt) ->
    @last_touch_time? and Date.now() - @last_touch_time < 500 and evt?.type isnt 'touchstart'

  outerHTML: (element) ->
    return element.outerHTML if element.outerHTML
    tmp = document.createElement("div")
    tmp.appendChild(element)
    tmp.innerHTML

  get_single_html: ->
    """
      <a class="chosen-single chosen-default" role="combobox" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
        <span>#{this.escape_html(@default_text)}</span>
        <div>
          <b aria-hidden="true"></b>
        </div>
      </a>
      <div class="chosen-drop" aria-hidden="true">
        <div class="chosen-search">
          <input
            aria-autocomplete="list"
            aria-expanded="false"
            aria-haspopup="listbox"
            autocomplete="off"
            class="chosen-search-input"
            type="#{@search_input_type}"
            role="combobox"
          />
        </div>
        <ul
          aria-busy="true"
          class="chosen-results"
          role="listbox"
        >
        </ul>
      </div>
      <span class="chosen-results-status visually-hidden" role="status" aria-live="polite" aria-atomic="true"></span>
    """

  get_multi_html: ->
    """
      <ul class="chosen-choices">
        <li class="search-field">
          <input
            aria-autocomplete="list"
            aria-expanded="false"
            aria-haspopup="listbox"
            autocomplete="off"
            class="chosen-search-input"
            role="combobox"
            style="width:25px;"
            type="#{@search_input_type}"
          />
        </li>
      </ul>
      <div class="chosen-drop" aria-hidden="true">
        <ul
          aria-busy="true"
          class="chosen-results"
          role="listbox"
        >
        </ul>
      </div>
      <span class="chosen-results-status visually-hidden" role="status" aria-live="polite" aria-atomic="true"></span>
    """

  get_no_results_html: (terms) ->
    if @no_results_template?
      search = "<span>#{this.escape_html(terms)}</span>"
      content = @no_results_template.split("{search}").map((part) => this.escape_html(part)).join(search)
      return "<li class=\"no-results\">#{content}</li>"
    """
      <li class="no-results">
        #{this.escape_html(@results_none_found)} <span>#{this.escape_html(terms)}</span>
      </li>
    """

  get_option_element: ({ value, text }) ->
    new Option(text, value, true, true)

  get_create_option_html: (terms) ->
    """
      <li class="create-option active-result" role="option"><a>#{this.escape_html(@create_option_text)}</a> <span>#{this.escape_html(terms)}</span></li>
    """

  # class methods and variables ============================================================

  @browser_is_supported: ->
    if "Microsoft Internet Explorer" is window.navigator.appName
      return document.documentMode >= 8
    return true

  @default_multiple_text: "Select Some Options"
  @default_single_text: "Select an Option"
  @default_no_result_text: "No results for:"
  @default_create_option_text: "Add Option:"
  @default_remove_item_text: "Remove selection"
  @default_select_all_text: "Select all"
  @default_deselect_all_text: "Deselect all"
  @data_attribute_types:
    allow_single_deselect: 'boolean'
    allow_select_all: 'boolean'
    allow_deselect_all: 'boolean'
    deselect_selected_results: 'boolean'
    disable_search: 'boolean'
    enable_split_word_search: 'boolean'
    inherit_select_classes: 'boolean'
    inherit_option_classes: 'boolean'
    inherit_optgroup_classes: 'boolean'
    paste_multiple_values: 'boolean'
    create_option: 'boolean'
    persistent_create_option: 'boolean'
    skip_no_results: 'boolean'
    search_contains: 'boolean'
    highlight_prefix_matches: 'boolean'
    split_search_terms: 'boolean'
    search_in_values: 'boolean'
    group_search: 'boolean'
    backspace_deletes_choices: 'boolean'
    single_backstroke_delete: 'boolean'
    multiselect_allow_tab_to_select: 'boolean'
    open_on_label_click: 'boolean'
    recalculate_width_on_update: 'boolean'
    display_disabled_options: 'boolean'
    display_selected_options: 'boolean'
    display_selected_value: 'boolean'
    include_group_label_in_selected: 'boolean'
    case_sensitive_search: 'boolean'
    hide_results_on_select: 'boolean'
    rtl: 'boolean'
    disable_search_threshold: 'integer'
    max_selected_options: 'integer'
    max_items_shown: 'integer'
    min_search_length: 'integer'
    max_search_length: 'integer'
    search_delay: 'integer'
    max_shown_results: 'integer'
    select_all_text: 'string'
    deselect_all_text: 'string'
    show_fewer_items_text: 'string'
    no_results_text: 'string'
    no_results_template: 'string'
    create_option_text: 'string'
    placeholder_text: 'string'
    placeholder_text_single: 'string'
    placeholder_text_multiple: 'string'
    placeholder_text_multiple_selected: 'string'
    width: 'width'
    dropdown_width: 'css-width'
    search_input_type: 'search-input-type'
    dropdown_position: 'dropdown-position'
  @next_id: 0
