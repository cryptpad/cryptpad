// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BlockNoteEditor, filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from '@blocknote/core';
import { withCollaboration } from '@blocknote/core/yjs';
import { BlockNoteView } from '@blocknote/mantine';
import { FormattingToolbar, FormattingToolbarController, SuggestionMenuController, getDefaultReactSlashMenuItems, getFormattingToolbarItems } from '@blocknote/react';
import '@blocknote/mantine/style.css';

const getCryptDriveMenuItems = (editor, uploadImageFromCryptDrive) => {
    return getDefaultReactSlashMenuItems(editor)
        .filter((item) => !['video', 'audio', 'file'].includes(item.key))
        .map((item) => {
            if (item.key !== 'image') { return item; }
            return {
                ...item,
                group: 'CryptDrive',
                onItemClick: () => {
                    uploadImageFromCryptDrive((data) => {
                        if (!data?.url) { return; }
                        insertOrUpdateBlockForSlashMenu(editor, {
                            type: 'image',
                            props: { name: data.name, url: data.url },
                        });
                    });
                },
            };
        });
};

// Creates a BlockNote editor and mounts it into `element`
// `options.view` contains the BlockNoteView props (theme, editable, etc),
// everything else is passed to BlockNoteEditor.create
// If 'collaboration' is set, options are wrapped using withCollaboration
const useBlockNoteEditor = (element, { view = {}, ...options } = {}) => {
    const editor = BlockNoteEditor.create(
        options.collaboration ? withCollaboration(options) : options
    );
    const root = createRoot(element);
    const { uploadImageFromCryptDrive, ...viewProps } = view;
    root.render(React.createElement(BlockNoteView, {...viewProps, editor, filePanel: false, slashMenu: false, formattingToolbar: false },
            React.createElement(SuggestionMenuController, {
                triggerCharacter: '/',
                getItems: async (query) => filterSuggestionItems(
                    getCryptDriveMenuItems(editor, uploadImageFromCryptDrive),
                    query
                ),
            }),
            // remove BlockNote image download and replace image (fail in CryptPad) -- to be changed
            React.createElement(FormattingToolbarController, {
                formattingToolbar: () => React.createElement(FormattingToolbar, null, getFormattingToolbarItems().filter((item) => !['replaceFileButton', 'fileDownloadButton'].includes(item.key)))
            })
        )
    );

    return {
        editor,
        ydoc: options.collaboration?.fragment?.doc,
        provider: options.collaboration?.provider,
        unmount: () => root.unmount()
    };
};

export default { useBlockNoteEditor, YJS: Y, IndexeddbPersistence };
