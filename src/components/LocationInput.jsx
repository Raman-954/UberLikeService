import { useState } from "react";

export default function LocationInput({ placeholder, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const search = async (value) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${value}&countrycodes=in&limit=5`
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white shadow-xl">
          {results.map((place, index) => (
            <div
              key={index}
              onClick={() => {
                setQuery(place.display_name);
                setResults([]);

                onSelect({
                  name: place.display_name,
                  center: [
                    parseFloat(place.lon),
                    parseFloat(place.lat),
                  ],
                });
              }}
              className="cursor-pointer px-4 py-3 text-sm hover:bg-neutral-100"
            >
              {place.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}