import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { IFormValues } from "../chat/AddFriendModel";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { DialogFooter } from "../ui/dialog";
import { DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

interface SearchFormProps {
  register: UseFormRegister<IFormValues>;
  errors: FieldErrors<IFormValues>;
  loading: boolean;
  usernameValue: string;
  isFound: boolean | null;
  searchedUsername: string;
  searchError?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const SearchForm = ({
  register,
  errors,
  usernameValue,
  loading,
  isFound,
  searchedUsername,
  searchError,
  onSubmit,
  onCancel,
}: SearchFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-semibold">
          Tim bang username
        </Label>

        <Input
          id="username"
          placeholder="Go ten username vao day..."
          className="glass border-border/50 focus:border-primary/50 transition-smooth"
          {...register("username", {
            required: "Username khong duoc bo trong",
          })}
        />
        {errors.username && (
          <p className="error-message">{errors.username.message}</p>
        )}

        {isFound === false && (
          <span className="error-message">
            {searchError || (
              <>
                Khong tim thay{" "}
                <span className="font-semibold">@{searchedUsername}</span>
              </>
            )}
          </span>
        )}
      </div>

      <DialogFooter>
        <DialogClose>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass hover:text-destructive"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </DialogClose>

        <Button
          type="submit"
          disabled={loading || !usernameValue?.trim()}
          className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
        >
          {loading ? (
            <span>Dang tim ...</span>
          ) : (
            <>
              <Search className="size-4 mr-2" /> Tim
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SearchForm;
