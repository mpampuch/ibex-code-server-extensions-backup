
# define our own method to avoid type piracy with Base.showable
_showable(a::AbstractVector{<:MIME}, x) = any(m -> showable(m, x), a)
_showable(m, x) = showable(m, x)

"""
A vector of MIME types (or vectors of MIME types) that IJulia will try to
render. IJulia will try to render every MIME type specified in the first level
of the vector. If a vector of MIME types is specified, IJulia will include only
the first MIME type that is renderable (this allows for the expression of
priority and exclusion of redundant data).

For example, since "text/plain" is specified as a first-child of the array,
IJulia will always try to include a "text/plain" representation of anything that
is displayed. Since markdown and html are specified within a sub-vector, IJulia
will always try to render "text/markdown", and will only try to render
"text/html" if markdown isn't possible.
"""
const ijulia_mime_types = Vector{Union{MIME, AbstractVector{MIME}}}([
    MIME("text/plain"),
    MIME("image/svg+xml"),
    [MIME("image/png"),MIME("image/jpeg")],
    [
        MIME("text/markdown"),
        MIME("text/html"),
    ],
    MIME("text/latex"),
])

"""
MIME types that when rendered (via stringmime) return JSON data. See
`ijulia_mime_types` for a description of how MIME types are selected.

This is necessary to embed the JSON as is in the displaydata bundle (rather than
as stringify'd JSON).
"""
const ijulia_jsonmime_types = Vector{Union{MIME, Vector{MIME}}}([
    [[MIME("application/vnd.vegalite.v$n+json") for n in 5:-1:2]...,
    [MIME("application/vnd.vega.v$n+json") for n in 5:-1:3]...],
    MIME("application/vnd.dataresource+json"), MIME("application/vnd.plotly.v1+json")
])

register_mime(x::Union{MIME, Vector{MIME}})= push!(ijulia_mime_types, x)
register_mime(x::AbstractVector{<:MIME}) = push!(ijulia_mime_types, Vector{Mime}(x))
register_jsonmime(x::Union{MIME, Vector{MIME}}) = push!(ijulia_jsonmime_types, x)
register_jsonmime(x::AbstractVector{<:MIME}) = push!(ijulia_jsonmime_types, Vector{Mime}(x))

"""
Generate the preferred MIME representation of x.

Returns a tuple with the selected MIME type and the representation of the data
using that MIME type.
"""
function display_mimestring(mime_array::Vector{MIME}, x)
    for m in mime_array
        if _showable(m, x)
            return display_mimestring(m, x)
        end
    end
    error("No displayable MIME types in mime array.")
end

display_mimestring(m::MIME, x) = (m, limitstringmime(m, x))

# text/plain output must have valid Unicode data to display in Jupyter
function display_mimestring(m::MIME"text/plain", x)
    s = limitstringmime(m, x)
    return m, (isvalid(s) ? s : "(binary data)")
end

"""
Generate the preferred json-MIME representation of x.

Returns a tuple with the selected MIME type and the representation of the data
using that MIME type (as a `JSONText`).
"""
function display_mimejson(mime_array::Vector{MIME}, x)
    for m in mime_array
        if _showable(m, x)
            return display_mimejson(m, x)
        end
    end
    error("No displayable MIME types in mime array.")
end

display_mimejson(m::MIME, x) = (m, JSON.JSONText(limitstringmime(m, x)))

"""
Generate a dictionary of `mime_type => data` pairs for all registered MIME
types. This is the format that Jupyter expects in display_data and
execute_result messages.
"""
function display_dict(x)
    data = Dict{String, Union{String, JSONText}}()
    for m in ijulia_mime_types
        try
            if _showable(m, x)
                mime, mime_repr = display_mimestring(m, x)
                data[string(mime)] = mime_repr
            end
        catch
            if m == MIME("text/plain")
                rethrow() # text/plain is required
            end
        end
    end

    for m in ijulia_jsonmime_types
        try
            if _showable(m, x)
                mime, mime_repr = display_mimejson(m, x)
                data[string(mime)] = mime_repr
            end
        catch
        end
    end

    return data

end
