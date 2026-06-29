import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Image as ImageIcon, Search, Loader2 } from "lucide-react";
import { Input } from "../ui/input";

interface GifPickerProps {
  onSelect: (url: string) => void;
}

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || "dc6zaTOxFJmzC"; // fallback to public beta key

const GifPicker = ({ onSelect }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = async (query: string) => {
    setLoading(true);
    try {
      let url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=12&rating=g`;
      if (query.trim()) {
        url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=12&rating=g`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (err) {
      console.error("Lỗi khi tải GIF:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      const delayDebounce = setTimeout(() => {
        fetchGifs(search);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [search, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="cursor-pointer hover:text-primary transition-colors" asChild>
        <button type="button" title="Gửi ảnh GIF">
          <ImageIcon className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        sideOffset={12}
        className="w-72 p-3 bg-background border border-border rounded-xl shadow-lg flex flex-col gap-3"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm GIF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <div className="h-48 overflow-y-auto no-scrollbar grid grid-cols-2 gap-1.5 min-h-[180px]">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center h-full">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="col-span-2 flex items-center justify-center text-xs text-muted-foreground">
              Không tìm thấy GIF nào
            </div>
          ) : (
            gifs.map((gif) => {
              const url = gif.images?.fixed_width?.url;
              return (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    if (url) {
                      onSelect(url);
                      setOpen(false);
                    }
                  }}
                  className="overflow-hidden rounded-lg bg-muted/40 hover:opacity-80 transition-opacity aspect-[4/3] relative"
                >
                  <img
                    src={url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GifPicker;
