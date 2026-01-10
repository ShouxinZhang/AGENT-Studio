import { WordEntry } from '../types';

export const GRAFFITI_COLORS = ['#FF0055', '#00FFFF', '#FFFF00', '#00FF00', '#FFFFFF'];

export const MOCK_DB: WordEntry[] = [
    {
        id: "serendipity",
        word: "Serendipity",
        pronunciation: "/ˌsɛrənˈdɪpɪti/",
        meaning: "意外发现珍奇事物的本领",
        semantics: "The occurrence of events by chance in a happy or beneficial way.",
        tags: ["Noun", "Positive", "Literary"],
        images: [
            "https://images.unsplash.com/photo-1540679093836-8cf9cbced60c?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1507908708918-778587c9e563?auto=format&fit=crop&q=80&w=800"
        ],
        noteContent: `
# My Impression

It's like finding a **$20 bill** in an old pair of jeans.

> "I didn't lose the gold watch, I found the sunset."

## Usage
- It was pure *serendipity* that we met at the coffee shop.
- Science is full of serendipity.

## Synonyms
- Fluke
- Happy accident
`
    },
    {
        id: "ethereal",
        word: "Ethereal",
        pronunciation: "/ɪˈθɪərɪəl/",
        meaning: "超凡脱俗的；飘渺的",
        semantics: "Extremely delicate and light in a way that seems too perfect for this world.",
        tags: ["Adjective", "Beautiful", "Nature"],
        images: [
            "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800"
        ],
        noteContent: `
# Feeling

*Something like elf magic.* 

When the morning mist covers the lake, the scene is truly **ethereal**.

*   Light
*   Airy
*   Tenous
`
    },
    {
        id: "ephemeral",
        word: "Ephemeral",
        pronunciation: "/ɪˈfɛmərəl/",
        meaning: "短暂的；朝生暮死的",
        semantics: "Lasting for a very short time.",
        tags: ["Adjective", "Time", "Philosophy"],
        images: [
            "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800"
        ],
        noteContent: `
# Thoughts

**Life is ephemeral.** 

Like a *cherry blossom* falling.

> "Fashions are ephemeral, changing with every season."
`
    }
];
