import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PaletteIcon, TagIcon, XIcon } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { toast } from '@/hooks/use-toast';

const suggestedTraits = [
  'Friendly', 'Professional', 'Creative', 'Analytical', 'Humorous',
  'Detailed', 'Concise', 'Patient', 'Direct', 'Encouraging',
  'Technical', 'Visual', 'Practical', 'Theoretical', 'Collaborative'
];

const themeOptions = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and professional design with neutral colors',
    colors: {
      light: {
        primary: '#0f172a',
        background: '#ffffff',
        foreground: '#0f172a',
        accent: '#f1f5f9',
        secondary: '#f1f5f9',
        muted: '#f8fafc',
        card: '#ffffff',
        border: '#e2e8f0'
      },
      dark: {
        primary: '#f8fafc',
        background: '#0f172a',
        foreground: '#f8fafc',
        accent: '#1e293b',
        secondary: '#1e293b',
        muted: '#334155',
        card: '#1e293b',
        border: '#334155'
      }
    }
  },
  {
    id: 'calming',
    name: 'Calming',
    description: 'Soft blues for a peaceful experience',
    colors: {
      light: {
        primary: '#0369a1',
        background: '#f0f9ff',
        foreground: '#0c4a6e',
        accent: '#e0f2fe',
        secondary: '#bae6fd',
        muted: '#f0f9ff',
        card: '#ffffff',
        border: '#7dd3fc'
      },
      dark: {
        primary: '#7dd3fc',
        background: '#0c4a6e',
        foreground: '#f0f9ff',
        accent: '#075985',
        secondary: '#0369a1',
        muted: '#164e63',
        card: '#075985',
        border: '#0284c7'
      }
    }
  },
  {
    id: 'grass',
    name: 'Grass',
    description: 'Fresh greens inspired by nature',
    colors: {
      light: {
        primary: '#15803d',
        background: '#f0fdf4',
        foreground: '#14532d',
        accent: '#dcfce7',
        secondary: '#bbf7d0',
        muted: '#f0fdf4',
        card: '#ffffff',
        border: '#4ade80'
      },
      dark: {
        primary: '#4ade80',
        background: '#14532d',
        foreground: '#f0fdf4',
        accent: '#166534',
        secondary: '#15803d',
        muted: '#16a34a',
        card: '#166534',
        border: '#22c55e'
      }
    }
  },
  {
    id: 'girly',
    name: 'Girly',
    description: 'Warm pinks and purples with playful elements',
    colors: {
      light: {
        primary: '#be185d',
        background: '#fdf2f8',
        foreground: '#831843',
        accent: '#fce7f3',
        secondary: '#f9a8d4',
        muted: '#fdf2f8',
        card: '#ffffff',
        border: '#f472b6'
      },
      dark: {
        primary: '#f9a8d4',
        background: '#831843',
        foreground: '#fdf2f8',
        accent: '#be185d',
        secondary: '#ec4899',
        muted: '#a21caf',
        card: '#be185d',
        border: '#f472b6'
      }
    }
  }
];

const CustomizationTab = () => {
  const { user } = useAuth();
  const { setTheme, applyTheme } = useTheme();
  const [profile, setProfile] = useState({
    preferred_name: '',
    occupation: '',
    chat_traits: [] as string[],
    selected_theme: 'modern',
    custom_primary_color: '#0f172a'
  });
  const [loading, setLoading] = useState(false);
  const [newTrait, setNewTrait] = useState('');
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [customColor, setCustomColor] = useState('#0f172a');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('preferred_name, occupation, chat_traits, selected_theme, custom_primary_color')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          preferred_name: data.preferred_name || '',
          occupation: data.occupation || '',
          chat_traits: data.chat_traits || [],
          selected_theme: data.selected_theme || 'modern',
          custom_primary_color: data.custom_primary_color || '#0f172a'
        });
        setCustomColor(data.custom_primary_color || '#0f172a');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          preferred_name: profile.preferred_name || null,
          occupation: profile.occupation || null,
          chat_traits: profile.chat_traits.length > 0 ? profile.chat_traits : null,
          selected_theme: profile.selected_theme,
          custom_primary_color: profile.custom_primary_color
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Update the theme in the useTheme hook
      setTheme(profile.selected_theme);
      applyTheme(profile.selected_theme);

      toast({
        title: "Customization Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    setProfile(prev => ({ ...prev, selected_theme: themeId }));
    // Apply theme immediately for preview
    applyTheme(themeId);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setProfile(prev => ({ ...prev, custom_primary_color: color }));
  };

  const addTrait = (trait: string) => {
    if (trait && !profile.chat_traits.includes(trait)) {
      setProfile(prev => ({
        ...prev,
        chat_traits: [...prev.chat_traits, trait]
      }));
    }
    setNewTrait('');
  };

  const removeTrait = (traitToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      chat_traits: prev.chat_traits.filter(trait => trait !== traitToRemove)
    }));
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="w-5 h-5" />
            Personal Preferences
          </CardTitle>
          <CardDescription>
            Customize how the AI should interact with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred-name">What should I call you?</Label>
            <Input
              id="preferred-name"
              value={profile.preferred_name}
              onChange={(e) => setProfile(prev => ({ ...prev, preferred_name: e.target.value }))}
              placeholder="Your preferred name or title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="occupation">What do you do?</Label>
            <Input
              id="occupation"
              value={profile.occupation}
              onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
              placeholder="Your occupation or role"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="w-5 h-5" />
            Theme Style
          </CardTitle>
          <CardDescription>
            Choose a visual theme that applies across the entire app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {themeOptions.map((theme) => (
              <div
                key={theme.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  profile.selected_theme === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div className="w-full h-12 rounded mb-3 flex">
                  <div 
                    className="flex-1 rounded-l" 
                    style={{ backgroundColor: theme.colors.light.primary }}
                  ></div>
                  <div 
                    className="flex-1 rounded-r" 
                    style={{ backgroundColor: theme.colors.dark.primary }}
                  ></div>
                </div>
                <h4 className="font-medium text-foreground">{theme.name}</h4>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
              </div>
            ))}
            
            {/* Custom Theme Option */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                profile.selected_theme === 'custom'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
              onClick={() => {
                handleThemeSelect('custom');
                setShowCustomTheme(true);
              }}
            >
              <div className="w-full h-12 rounded mb-3 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <PaletteIcon className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-medium text-foreground">Custom</h4>
              <p className="text-sm text-muted-foreground">Create your own color scheme</p>
            </div>
          </div>

          {/* Custom Color Picker Dialog */}
          <Dialog open={showCustomTheme} onOpenChange={setShowCustomTheme}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Custom Theme</DialogTitle>
                <DialogDescription>
                  Choose your primary color for the custom theme
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <ColorPicker
                  color={customColor}
                  onChange={handleCustomColorChange}
                  label="Primary Color"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCustomTheme(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCustomTheme(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Chat Traits
          </CardTitle>
          <CardDescription>
            Select traits that describe how you'd like the AI to communicate with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Selected Traits</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md">
              {profile.chat_traits.length === 0 ? (
                <span className="text-gray-500">No traits selected</span>
              ) : (
                profile.chat_traits.map((trait) => (
                  <Badge key={trait} variant="secondary" className="flex items-center gap-1">
                    {trait}
                    <XIcon 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeTrait(trait)}
                    />
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add Custom Trait</Label>
            <div className="flex gap-2">
              <Input
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                placeholder="Enter a custom trait"
                onKeyPress={(e) => e.key === 'Enter' && addTrait(newTrait)}
              />
              <Button onClick={() => addTrait(newTrait)} disabled={!newTrait}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Suggested Traits</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedTraits.map((trait) => (
                <Badge
                  key={trait}
                  variant={profile.chat_traits.includes(trait) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => profile.chat_traits.includes(trait) ? removeTrait(trait) : addTrait(trait)}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={updateProfile} disabled={loading}>
            Save Customization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomizationTab;
