import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuantityControl from '../components/QuantityControl';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import MenuCard from '../components/MenuCard';
import type { MenuItem } from '../types';

describe('QuantityControl', () => {
  it('현재 값을 표시한다', () => {
    render(<QuantityControl value={3} onChange={() => {}} />);
    expect(screen.getByTestId('quantity-value')).toHaveTextContent('3');
  });

  it('증가 버튼 클릭 시 onChange가 호출된다', () => {
    const onChange = vi.fn();
    render(<QuantityControl value={3} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('quantity-increase'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('감소 버튼 클릭 시 onChange가 호출된다', () => {
    const onChange = vi.fn();
    render(<QuantityControl value={3} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('quantity-decrease'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('최소값에서 감소 버튼이 비활성화된다', () => {
    render(<QuantityControl value={1} min={1} onChange={() => {}} />);
    expect(screen.getByTestId('quantity-decrease')).toBeDisabled();
  });

  it('최대값에서 증가 버튼이 비활성화된다', () => {
    render(<QuantityControl value={99} max={99} onChange={() => {}} />);
    expect(screen.getByTestId('quantity-increase')).toBeDisabled();
  });
});

describe('OrderStatusBadge', () => {
  it('대기중 상태를 표시한다', () => {
    render(<OrderStatusBadge status="pending" />);
    expect(screen.getByText('대기중')).toBeInTheDocument();
  });

  it('준비중 상태를 표시한다', () => {
    render(<OrderStatusBadge status="preparing" />);
    expect(screen.getByText('준비중')).toBeInTheDocument();
  });

  it('완료 상태를 표시한다', () => {
    render(<OrderStatusBadge status="completed" />);
    expect(screen.getByText('완료')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('isOpen이 false이면 렌더링하지 않는다', () => {
    render(<ConfirmDialog isOpen={false} title="테스트" message="메시지" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText('테스트')).not.toBeInTheDocument();
  });

  it('isOpen이 true이면 제목과 메시지를 표시한다', () => {
    render(<ConfirmDialog isOpen={true} title="삭제 확인" message="정말 삭제하시겠습니까?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('삭제 확인')).toBeInTheDocument();
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('확인 버튼 클릭 시 onConfirm이 호출된다', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog isOpen={true} title="테스트" message="메시지" onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog isOpen={true} title="테스트" message="메시지" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('MenuCard', () => {
  const mockMenu: MenuItem = {
    id: 1,
    storeId: 'test',
    categoryId: 1,
    name: '블랙 앵거스 스테이크',
    price: 89000,
    description: '최상급 블랙 앵거스 소고기',
    imageUrl: null,
    sortOrder: 1,
  };

  it('메뉴명과 가격을 표시한다', () => {
    render(<MenuCard menu={mockMenu} />);
    expect(screen.getByText('블랙 앵거스 스테이크')).toBeInTheDocument();
    expect(screen.getByText('₩89,000')).toBeInTheDocument();
  });

  it('설명을 표시한다', () => {
    render(<MenuCard menu={mockMenu} />);
    expect(screen.getByText('최상급 블랙 앵거스 소고기')).toBeInTheDocument();
  });

  it('클릭 시 onClick이 호출된다', () => {
    const onClick = vi.fn();
    render(<MenuCard menu={mockMenu} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('menu-card-1'));
    expect(onClick).toHaveBeenCalledWith(mockMenu);
  });

  it('showActions가 true이면 수정/삭제 버튼이 표시된다', () => {
    render(<MenuCard menu={mockMenu} showActions onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByTestId('menu-edit-1')).toBeInTheDocument();
    expect(screen.getByTestId('menu-delete-1')).toBeInTheDocument();
  });
});
