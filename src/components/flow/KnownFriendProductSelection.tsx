import { Gift, ShoppingBag } from 'lucide-react';

interface KnownFriend {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  purchaseHistory: { item: string; occasion: string }[];
}

interface KnownFriendProductSelectionProps {
  friend: KnownFriend;
  onContinue: () => void;
}

export function KnownFriendProductSelection({ 
  friend, 
  onContinue 
}: KnownFriendProductSelectionProps) {
  const hasPurchaseHistory = friend.purchaseHistory.length > 0;
  const lastPurchase = friend.purchaseHistory[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-sour-green/20 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-sour-green" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          {friend.name}!
        </h2>
        {hasPurchaseHistory ? (
          <p className="text-muted-foreground">
            That's the friend you bought the <span className="font-semibold text-sour-green">{lastPurchase.item}</span> for! 
            <br />
            What would you like to get {friend.name} this time?
          </p>
        ) : (
          <p className="text-muted-foreground">
            Great choice! What would you like to get for {friend.name}?
          </p>
        )}
      </div>

      <div className="bg-secondary/30 rounded-xl p-4 max-w-md mx-auto">
        <h4 className="font-medium text-sm mb-2">About {friend.name}:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {friend.age} years old, {friend.gender}</li>
          <li>• Interests: {friend.interests.join(', ')}</li>
          {hasPurchaseHistory && (
            <li>• Previous gift: {lastPurchase.item} ({lastPurchase.occasion})</li>
          )}
        </ul>
      </div>

      <div className="text-center">
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-8 py-4 bg-sour-green text-white rounded-full font-semibold hover:bg-sour-green-dark transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          <ShoppingBag className="w-5 h-5" />
          Browse Products
        </button>
      </div>
    </div>
  );
}
