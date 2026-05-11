import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { EditorView } from 'prosemirror-view';
import { Observable, Subscription } from 'rxjs';

import { AsyncPipe, CommonModule } from '@angular/common';
import { NgxEditorService } from '../../../editor.service';
import { TBHeadingItems } from '../../../types';
import { MenuService } from '../menu.service';
import { ToggleCommands } from '../MenuCommands';

@Component({
  selector: 'ngx-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  imports: [AsyncPipe, CommonModule],
})
export class DropdownComponent implements OnInit, OnDestroy, AfterViewChecked {
  private ngxeService = inject(NgxEditorService);
  private menuService = inject(MenuService);
  private el = inject(ElementRef);

  private editorView: EditorView;
  private updateSubscription: Subscription;

  @Input() group: string;
  @Input() items: TBHeadingItems[];

  isDropdownOpen = false;
  private shouldFocusOnOpen = false;

  disabledItems: string[] = [];
  activeItem: string | null;

  get isSelected(): boolean {
    return Boolean(this.activeItem || this.isDropdownOpen);
  }

  get isDropdownDisabled(): boolean {
    return this.disabledItems.length === this.items.length;
  }

  @HostListener('document:mousedown', ['$event.target']) onDocumentClick(target: EventTarget): void {
    if (!this.el.nativeElement.contains(target as Node) && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  getName(key: string): Observable<string> {
    return this.ngxeService.locals.get(key);
  }

  getIsDropdownActive(item: string): boolean {
    return this.activeItem === item;
  }

  private getTriggerButton(): HTMLButtonElement | null {
    return (this.el.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button.NgxEditor__Dropdown--Text',
    );
  }

  private getDropdownItemButtons(): HTMLButtonElement[] {
    return Array.from(
      (this.el.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.NgxEditor__Dropdown--DropdownMenu button',
      ),
    );
  }

  private findEnabledItemIndex(buttons: HTMLButtonElement[], start: number, step: 1 | -1): number {
    const len = buttons.length;
    for (let i = 0; i < len; i += 1) {
      const idx = ((start + step * i) % len + len) % len;
      if (!buttons[idx].disabled) {
        return idx;
      }
    }
    return -1;
  }

  openDropdown(): void {
    if (!this.isDropdownOpen) {
      this.isDropdownOpen = true;
      this.shouldFocusOnOpen = true;
    }
  }

  closeDropdown(returnFocus: boolean): void {
    if (!this.isDropdownOpen) {
      return;
    }
    this.isDropdownOpen = false;
    if (returnFocus) {
      this.getTriggerButton()?.focus();
    }
  }

  toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown(false);
    } else {
      this.openDropdown();
    }
  }

  onToggleDropdownMouseClick(e: MouseEvent): void {
    e.preventDefault();

    if (e.button !== 0) {
      return;
    }

    this.toggleDropdown();
  }

  onToggleDropdownKeydown(): void {
    this.toggleDropdown();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openDropdown();
    }
  }

  @HostListener('keydown.escape', ['$event']) onEscape(e: Event): void {
    if (!this.isDropdownOpen) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.closeDropdown(true);
  }

  onDropdownKeydown(event: KeyboardEvent): void {
    const buttons = this.getDropdownItemButtons();
    if (buttons.length === 0) {
      return;
    }

    const currentIndex = buttons.indexOf(event.target as HTMLButtonElement);

    if (event.key === 'Tab') {
      // Tab while a dropdown item is focused: close the dropdown and let the
      // browser proceed with normal tab navigation from the trigger.
      this.closeDropdown(false);
      return;
    }

    if (currentIndex === -1) {
      return;
    }

    let nextIndex = -1;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = this.findEnabledItemIndex(buttons, currentIndex + 1, 1);
        break;
      case 'ArrowUp':
        nextIndex = this.findEnabledItemIndex(buttons, currentIndex - 1, -1);
        break;
      case 'Home':
        nextIndex = this.findEnabledItemIndex(buttons, 0, 1);
        break;
      case 'End':
        nextIndex = this.findEnabledItemIndex(buttons, buttons.length - 1, -1);
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (nextIndex !== -1 && nextIndex !== currentIndex) {
      buttons[nextIndex].focus();
    }
  }

  selectItem(item: TBHeadingItems, returnFocusToEditor: boolean): void {
    const command = ToggleCommands[item];
    const { state, dispatch } = this.editorView;
    command.toggle()(state, dispatch);
    // Close without restoring trigger focus — caller decides where focus goes.
    this.isDropdownOpen = false;
    if (returnFocusToEditor) {
      // Defer so the editor doesn't receive the still-in-flight key event.
      setTimeout(() => this.editorView.focus(), 0);
    }
  }

  onDropdownItemMouseClick(e: MouseEvent, item: TBHeadingItems): void {
    e.preventDefault();

    // consider only left click
    if (e.button !== 0) {
      return;
    }

    this.selectItem(item, false);
  }

  onDropdownItemKeydown(event: Event, item: TBHeadingItems): void {
    const e = event as KeyboardEvent;
    e.preventDefault();
    e.stopPropagation();
    this.selectItem(item, true);
  }

  private update = (view: EditorView) => {
    const { state } = view;
    this.disabledItems = [];
    const activeItems = [];

    this.items.forEach((item: TBHeadingItems) => {
      const command = ToggleCommands[item];
      const isActive = command.isActive(state);

      if (isActive) {
        activeItems.push(item);
      }

      if (!command.canExecute(state)) {
        this.disabledItems.push(item);
      }
    });

    if (activeItems.length === 1) {
      [this.activeItem] = activeItems;
    } else {
      this.activeItem = null;
    }
  };

  ngOnInit(): void {
    this.editorView = this.menuService.editor.view;

    this.updateSubscription = this.menuService.editor.update.subscribe((view: EditorView) => {
      this.update(view);
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldFocusOnOpen) {
      this.shouldFocusOnOpen = false;
      const buttons = this.getDropdownItemButtons();
      if (buttons.length === 0) {
        return;
      }
      // Focus the active item if there is one and it's not disabled, else the first enabled item.
      const activeBtnIndex = this.activeItem
        ? buttons.findIndex(
            (b, i) => this.items[i] === this.activeItem && !this.disabledItems.includes(this.activeItem),
          )
        : -1;
      const target =
        activeBtnIndex !== -1
          ? activeBtnIndex
          : this.findEnabledItemIndex(buttons, 0, 1);
      if (target !== -1) {
        buttons[target].focus();
      }
    }
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
  }
}
