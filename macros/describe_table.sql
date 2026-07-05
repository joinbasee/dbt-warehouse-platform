{% macro describe_table(table_name) %}
    {% set query = 'DESC ' ~ table_name %}
    {% set results = run_query(query) %}
    {% for row in results %}
        {{ row[0] }} {{ row[1] }}
    {% endfor %}
{% endmacro %}
