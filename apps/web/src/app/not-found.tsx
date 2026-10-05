import { BowlArt } from '@/components/brand/food-art';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <EmptyState
        art={<BowlArt variant="seblak" size={112} spoon={false} className="opacity-70 grayscale" />}
        title="Halamannya nggak ketemu, Kak"
        message="Mungkin link-nya salah atau menunya sudah tidak dijual."
        action={
          <ButtonLink href="/" fullWidth>
            Kembali ke Home
          </ButtonLink>
        }
      />
    </main>
  );
}
